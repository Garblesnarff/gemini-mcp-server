/**
 * LearningSystem — the v3 replacement for "Smart Tool Intelligence".
 *
 * What v2 did: keyword detection + canned prompt suffixes + a JSON diary
 * where every interaction was marked successful and nothing ever read it back.
 *
 * What this does:
 *   1. Logs every interaction with its real outcome (latency, errors).
 *   2. Accepts explicit feedback (gemini-feedback tool, 1-5 + note).
 *   3. Distills rated interactions into an explicit profile via Gemini itself.
 *   4. Injects that profile as system instructions — behavior really changes.
 *   5. Keeps chat session memory so conversations persist across calls.
 *   6. Exposes everything (gemini-profile tool) — no black box.
 */
import crypto from 'node:crypto';
import { createStore } from './store.js';
import { createIntentClassifier } from './intents.js';
import { distillProfile, profileToSystemPrompt, EMPTY_PROFILE } from './profile.js';

export function createLearningSystem({ dataDir, gemini, models, distillAfterRated = 10, log = () => {} }) {
  const store = createStore(dataDir);
  const cache = {
    get: (k) => store.sessions?.[`__cache_${k}`],
    set: (k, v) => {
      const s = store.sessions;
      s[`__cache_${k}`] = v;
      store.sessions = s;
    },
  };
  const classifier = createIntentClassifier({ gemini, embeddingModel: models.embedding, cache });

  function newId() {
    return crypto.randomBytes(8).toString('hex');
  }

  const system = {
    classifier,

    /** Classify a prompt's intent. Never throws. */
    detectIntent(text, explicit = null) {
      return classifier.classify(text, { explicit });
    },

    /** Record an interaction. Returns its id (for later feedback). */
    logInteraction({ tool, intent, prompt, modelUsed, ms, ok = true, error = null }) {
      const all = store.interactions;
      const entry = {
        id: newId(),
        ts: new Date().toISOString(),
        tool,
        intent: intent ?? 'general',
        prompt: String(prompt ?? '').slice(0, 500),
        modelUsed: modelUsed ?? null,
        ms: ms ?? null,
        ok,
        error: error ? String(error).slice(0, 300) : null,
        rating: null,
        note: null,
      };
      all.push(entry);
      // Cap the log so it can't grow forever (distillation keeps the wisdom).
      store.interactions = all.slice(-2000);
      return entry.id;
    },

    /**
     * Attach feedback to an interaction (or the most recent one).
     * Triggers distillation when enough new ratings accumulate.
     */
    async recordFeedback({ interactionId = null, rating, note = null }) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('rating must be an integer from 1 to 5');
      }
      const all = store.interactions;
      let target = interactionId ? all.find((i) => i.id === interactionId) : [...all].reverse().find((i) => i.rating == null);
      if (!target) throw new Error('No matching interaction found to rate.');
      target.rating = rating;
      if (note) target.note = String(note).slice(0, 500);
      store.interactions = all;

      const distilled = await system.maybeDistill();
      return { interactionId: target.id, tool: target.tool, distilled };
    },

    /** Distill if enough newly-rated interactions exist since the last run. */
    async maybeDistill({ force = false } = {}) {
      const profile = store.profile ?? { ...EMPTY_PROFILE };
      const rated = store.interactions.filter((i) => i.rating).length;
      const newSince = rated - (profile.distilledFrom ?? 0);
      if (!force && newSince < distillAfterRated) {
        return { distilled: false, ratedSinceLast: newSince, needed: distillAfterRated };
      }
      log(`Distilling profile from ${rated} rated interactions…`);
      const next = await distillProfile({ gemini, model: models.chat, interactions: store.interactions });
      if (!next) return { distilled: false, reason: 'distillation failed or not enough signal' };
      store.profile = next;
      log(`Profile updated: style="${next.style}" verbosity=${next.verbosity}`);
      return { distilled: true, profile: next };
    },

    getProfile() {
      return store.profile ?? { ...EMPTY_PROFILE };
    },

    setProfile(patch) {
      const current = system.getProfile();
      const next = {
        ...current,
        ...patch,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      store.profile = next;
      return next;
    },

    resetProfile() {
      store.profile = { ...EMPTY_PROFILE };
      return system.getProfile();
    },

    /** System instructions derived from the learned profile (null when empty). */
    getSystemPrompt() {
      return profileToSystemPrompt(system.getProfile());
    },

    interactionCount() {
      return store.interactions.length;
    },

    ratedCount() {
      return store.interactions.filter((i) => i.rating).length;
    },

    // ---- chat session memory ----

    newSession() {
      const id = `sess_${newId()}`;
      const sessions = store.sessions;
      sessions[id] = { id, createdAt: new Date().toISOString(), turns: [] };
      store.sessions = sessions;
      return id;
    },

    getSession(id) {
      return store.sessions[id] ?? null;
    },

    appendTurn(id, { role, text }) {
      const sessions = store.sessions;
      const s = sessions[id];
      if (!s) return false;
      s.turns.push({ role, text: String(text).slice(0, 8000), ts: new Date().toISOString() });
      // Keep the tail; very old turns are summarized away by the model anyway.
      if (s.turns.length > 60) s.turns = s.turns.slice(-60);
      store.sessions = sessions;
      return true;
    },

    listSessions() {
      return Object.values(store.sessions)
        .filter((s) => s && s.id && !s.id.startsWith('__cache_'))
        .map((s) => ({ id: s.id, createdAt: s.createdAt, turns: s.turns.length }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 20);
    },

    /** Build Gemini `contents` from a session history + new message. */
    sessionContents(id, newMessage) {
      const s = system.getSession(id);
      const contents = [];
      if (s) {
        for (const t of s.turns) {
          contents.push({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text }] });
        }
      }
      contents.push({ role: 'user', parts: [{ text: newMessage }] });
      return contents;
    },
  };

  return system;
}
