/** Build a test ctx: mock Gemini client, temp data/output dirs, quiet logger. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGemini } from '../src/gemini.js';
import { createLearningSystem } from '../src/learning/index.js';
import { config } from '../src/config.js';
import { createMockRawClient } from './mock-gemini.js';

export function makeCtx() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-mcp-test-'));
  const dataDir = path.join(tmp, 'data');
  const outputDir = path.join(tmp, 'output');
  const gemini = createGemini({ apiKey: 'test-key', client: createMockRawClient(), log: () => {} });
  const learning = createLearningSystem({
    dataDir, gemini, models: config.models, distillAfterRated: 3, log: () => {},
  });
  return {
    ctx: { gemini, learning, config, outputDir, log: () => {} },
    tmp, dataDir, outputDir,
    cleanup() { fs.rmSync(tmp, { recursive: true, force: true }); },
  };
}
