import test from 'node:test';
import assert from 'node:assert/strict';
import { detectByKeywords, createIntentClassifier, INTENTS } from '../src/learning/intents.js';
import { createGemini } from '../src/gemini.js';
import { config } from '../src/config.js';
import { createMockRawClient } from './mock-gemini.js';

test('keyword fast path detects code/debug/media', () => {
  assert.equal(detectByKeywords('help me debug this python error').intent, 'debug');
  assert.equal(detectByKeywords('implement a sort function').intent, 'code');
  assert.equal(detectByKeywords('generate an image of a cat').intent, 'media');
  assert.equal(detectByKeywords('hello there'), null); // no keyword hit -> null
});

test('embedding fallback classifies when keywords miss', async () => {
  // Custom mock: embedContent maps keyword-bearing texts to their intent's
  // one-hot vector; keyword-free texts map to general; the mystery phrase
  // maps to debug by test fiat.
  const raw = createMockRawClient();
  const names = Object.keys(INTENTS);
  raw.models.embedContent = async ({ contents }) => {
    const lower = String(contents).toLowerCase();
    let idx = names.indexOf('general');
    if (lower.includes('acting weird')) idx = names.indexOf('debug'); // fiat
    else {
      for (const [i, name] of names.entries()) {
        if (INTENTS[name].keywords.some((k) => lower.includes(k))) { idx = i; break; }
      }
    }
    return { embeddings: [{ values: names.map((_, i) => (i === idx ? 1 : 0.01)) }] };
  };
  const gemini = createGemini({ apiKey: 'x', client: raw, log: () => {} });
  const cache = { _m: {}, get(k) { return this._m[k]; }, set(k, v) { this._m[k] = v; } };
  const c = createIntentClassifier({ gemini, embeddingModel: config.models.embedding, cache });
  // No keyword in this phrase matches any intent list:
  const r = await c.classify('the thing is acting weird lately');
  assert.equal(r.intent, 'debug');
  assert.equal(r.method, 'embedding');
});

test('explicit context always wins', async () => {
  const gemini = createGemini({ apiKey: 'x', client: createMockRawClient(), log: () => {} });
  const c = createIntentClassifier({ gemini, embeddingModel: config.models.embedding, cache: null });
  const r = await c.classify('hello', { explicit: 'writing' });
  assert.equal(r.intent, 'writing');
  assert.equal(r.confidence, 1);
});

test('intent taxonomy covers the old v2 contexts', () => {
  // v2 had consciousness/code/debugging/verbatim/general — v3 keeps code/debug
  // and generalizes the rest; verbatim is now a tool param, not an intent.
  assert.ok(INTENTS.code && INTENTS.debug && INTENTS.general);
});
