/**
 * Mock Gemini client matching the @google/genai call surface used by src/gemini.js.
 * Deterministic — no network, no API key needed.
 */
import { INTENTS } from '../src/learning/intents.js';

const ONE_PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function intentVector(text) {
  const lower = text.toLowerCase();
  const intents = Object.keys(INTENTS);
  const vec = intents.map(() => 0.05);
  intents.forEach((name, i) => {
    if (INTENTS[name].keywords.some((k) => lower.includes(k))) vec[i] = 1.0;
  });
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map((v) => v / norm);
}

export function createMockRawClient() {
  return {
    models: {
      async generateContent({ contents, config }) {
        const text = JSON.stringify(contents);
        if (config?.responseModalities?.includes('IMAGE')) {
          return mockImageResponse();
        }
        if (config?.responseModalities?.includes('AUDIO')) {
          return {
            text: '',
            candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/wav', data: Buffer.from('mockwav').toString('base64') } }] } }],
          };
        }
        if (text.includes('preference-distillation')) {
          return {
            text: JSON.stringify({
              style: 'concise and direct',
              verbosity: 'terse',
              formats: ['bulleted lists'],
              interests: ['coding'],
              avoid: ['fluff', 'excessive hedging'],
              notes: ' distilled from mock interactions',
            }),
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          };
        }
        if (text.includes('word-for-word transcription')) {
          return { text: 'um well uh this is a mock transcript [laughs]', candidates: [{ content: { parts: [{ text: 'x' }] } }] };
        }
        return { text: 'mock reply', candidates: [{ content: { parts: [{ text: 'mock reply' }] } }] };
      },
      async generateVideos() {
        return { name: 'operations/mock-video-op-1', done: false };
      },
      async embedContent({ contents }) {
        return { embeddings: [{ values: intentVector(String(contents)) }] };
      },
    },
    operations: {
      async getVideosOperation() {
        return {
          done: true,
          response: { generatedVideos: [{ video: { videoBytes: Buffer.from('mockmp4').toString('base64') } }] },
        };
      },
    },
    files: {
      async upload() {
        return { uri: 'https://mock/files/123', name: 'files/123', mimeType: 'video/mp4' };
      },
    },
  };
}

// generateImage in the wrapper calls models.generateContent, so patch it:
export function mockImageResponse() {
  return {
    text: '',
    candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: ONE_PIXEL_PNG } }] } }],
  };
}
