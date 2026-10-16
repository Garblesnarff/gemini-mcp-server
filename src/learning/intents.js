/**
 * Intent detection for the learning system.
 *
 * Two-stage, honest about its limits:
 *   1. Keyword fast path — cheap, deterministic, no API call.
 *   2. Embedding fallback — cosine similarity against prototype phrases per
 *      intent, used only when no keyword fires. Prototypes are embedded once
 *      and cached on disk.
 *
 * This replaces v2's keyword-only detector with something that degrades
 * gracefully instead of pretending.
 */

export const INTENTS = {
  code: {
    keywords: ['code', 'implement', 'function', 'class', 'refactor', 'programming', 'script', 'api', 'typescript', 'python', 'javascript', 'npm'],
    prototypes: [
      'write a function that sorts a list',
      'help me implement this API endpoint',
      'refactor this class to be cleaner',
    ],
  },
  debug: {
    keywords: ['debug', 'fix', 'error', 'bug', 'issue', 'problem', 'not working', 'fails', 'exception', 'stack trace', 'crash'],
    prototypes: [
      'this code throws an error, why',
      'fix the bug in my program',
      'it crashes when I run it',
    ],
  },
  writing: {
    keywords: ['write', 'draft', 'essay', 'blog', 'story', 'rewrite', 'summarize', 'email', 'caption', 'headline'],
    prototypes: [
      'write a blog post about hiking',
      'draft an email to my team',
      'summarize this article',
    ],
  },
  research: {
    keywords: ['research', 'explain', 'what is', 'how does', 'compare', 'history of', 'science', 'study', 'paper', 'evidence'],
    prototypes: [
      'explain how black holes work',
      'research the history of the steam engine',
      'compare these two approaches',
    ],
  },
  media: {
    keywords: ['image', 'picture', 'photo', 'draw', 'illustrate', 'video', 'audio', 'voice', 'transcribe', 'painting'],
    prototypes: [
      'generate an image of a sunset',
      'transcribe this audio file',
      'create a video of ocean waves',
    ],
  },
  data: {
    keywords: ['data', 'csv', 'chart', 'plot', 'statistics', 'analyze numbers', 'spreadsheet', 'regression'],
    prototypes: [
      'analyze this csv data',
      'plot a chart of sales over time',
      'run statistics on this dataset',
    ],
  },
  general: {
    keywords: [],
    prototypes: ['hello', 'what can you do', 'tell me a joke'],
  },
};

export function detectByKeywords(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestHits = 0;
  for (const [intent, def] of Object.entries(INTENTS)) {
    if (intent === 'general') continue;
    const hits = def.keywords.filter((k) => lower.includes(k)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = intent;
    }
  }
  return bestHits > 0 ? { intent: best, method: 'keywords', confidence: Math.min(0.5 + bestHits * 0.15, 0.95) } : null;
}

function cosine(a, b) {
  let dot = 0; let na = 0; let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function createIntentClassifier({ gemini, embeddingModel, cache }) {
  // cache: { get(key), set(key, value) } — callers wire this to the store dir
  let prototypes = null; // intent -> averaged embedding vector

  async function loadPrototypes() {
    if (prototypes) return prototypes;
    const cached = cache?.get('intent-prototypes-v1');
    if (cached) {
      prototypes = cached;
      return prototypes;
    }
    prototypes = {};
    for (const [intent, def] of Object.entries(INTENTS)) {
      const vecs = [];
      for (const phrase of def.prototypes) {
        try {
          const v = await gemini.embed({ model: embeddingModel, text: phrase });
          if (v.length) vecs.push(v);
        } catch { /* embedding unavailable — skip */ }
      }
      if (vecs.length) {
        const dim = vecs[0].length;
        const avg = new Array(dim).fill(0);
        for (const v of vecs) for (let i = 0; i < dim; i++) avg[i] += v[i] / vecs.length;
        prototypes[intent] = avg;
      }
    }
    if (Object.keys(prototypes).length) cache?.set('intent-prototypes-v1', prototypes);
    return prototypes;
  }

  return {
    /** Classify text. Returns { intent, method, confidence }. Never throws. */
    async classify(text, { explicit = null } = {}) {
      if (explicit) {
        const key = explicit.toLowerCase();
        if (INTENTS[key]) return { intent: key, method: 'explicit', confidence: 1 };
      }
      const kw = detectByKeywords(text);
      if (kw) return kw;
      try {
        const protos = await loadPrototypes();
        if (!Object.keys(protos).length) return { intent: 'general', method: 'fallback', confidence: 0.3 };
        const v = await gemini.embed({ model: embeddingModel, text });
        if (!v.length) return { intent: 'general', method: 'fallback', confidence: 0.3 };
        let best = 'general'; let bestSim = 0.35; // minimum similarity bar
        for (const [intent, p] of Object.entries(protos)) {
          const sim = cosine(v, p);
          if (sim > bestSim) { bestSim = sim; best = intent; }
        }
        return { intent: best, method: best === 'general' ? 'fallback' : 'embedding', confidence: bestSim };
      } catch {
        return { intent: 'general', method: 'fallback', confidence: 0.3 };
      }
    },

    /** For tests: clear cached prototypes. */
    _reset() { prototypes = null; },
  };
}
