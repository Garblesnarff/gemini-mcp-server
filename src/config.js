/**
 * Central configuration for the Gemini MCP Server v3.
 *
 * Everything comes from the environment. There are no hardcoded API keys,
 * no fallback keys, and nothing secret is ever logged.
 */
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');

function env(name, fallback = '') {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

export const config = {
  /** Gemini Developer API key (https://aistudio.google.com/apikey). Required. */
  apiKey: env('GEMINI_API_KEY'),

  /** Optional OpenRouter key, used as a fallback provider for image tools. */
  openRouterKey: env('OPENROUTER_API_KEY'),
  openRouterBaseUrl: env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),

  outputDir: env('OUTPUT_DIR', path.join(ROOT, 'output')),
  dataDir: env('DATA_DIR', path.join(ROOT, 'data')),

  debug: env('DEBUG', 'false').toLowerCase() === 'true',

  httpPort: Number.parseInt(env('MCP_HTTP_PORT', '3100'), 10),

  models: {
    // Text + vision workhorse (Oct 2026 generation)
    chat: env('GEMINI_CHAT_MODEL', 'gemini-3.7-flash'),
    // Image generation + conversational editing (Nano Banana 2.1, GA Oct 2026)
    image: env('GEMINI_IMAGE_MODEL', 'gemini-nano-banana-2.1'),
    // Highest-quality image generation (Nano Banana Pro)
    imagePro: env('GEMINI_IMAGE_PRO_MODEL', 'gemini-3-pro-image'),
    // Video generation
    video: env('GEMINI_VIDEO_MODEL', 'veo-3.1-generate-001'),
    videoFast: env('GEMINI_VIDEO_FAST_MODEL', 'veo-3.1-fast-generate-001'),
    // Text-to-speech
    tts: env('GEMINI_TTS_MODEL', 'gemini-3.8-flash-tts'),
    // Embeddings for intent classification
    embedding: env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001'),
  },

  limits: {
    maxImageMb: 20,
    maxAudioMb: 25,
    maxVideoMb: 100,
    maxSessionTurns: 40,
  },

  learning: {
    /** Interactions with a rating before the distiller runs. */
    distillAfterRated: 10,
    /** Use embedding similarity for intent detection when keywords miss. */
    embeddingIntents: env('LEARNING_EMBEDDING_INTENTS', 'true').toLowerCase() === 'true',
  },
};

export function maskKey(key) {
  if (!key) return '(missing)';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function assertConfigured() {
  if (!config.apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Copy .env.example to .env and add your key from https://aistudio.google.com/apikey'
    );
  }
}
