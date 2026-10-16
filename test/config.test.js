import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('config has no hardcoded secrets', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'config.js'), 'utf8');
  assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(src), 'no Google API key pattern in config');
  assert.ok(!/sk-ant-|sk-or-/.test(src), 'no other provider key patterns');
  assert.ok(src.includes("env('GEMINI_API_KEY')"), 'key comes from env');
});

test('model IDs are the current generation (no 1.5/2.0 relics)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'config.js'), 'utf8');
  for (const dead of ['gemini-1.5', 'gemini-2.0', 'gemini-2.5-flash-image', 'image-preview']) {
    assert.ok(!src.includes(dead), `dead model reference still present: ${dead}`);
  }
  for (const live of ['gemini-nano-banana-2.1', 'gemini-3-pro-image', 'veo-3.1', 'gemini-3.8-flash-tts', 'gemini-embedding-001']) {
    assert.ok(src.includes(live), `expected current model id missing: ${live}`);
  }
});

test('.env.example documents every model override', () => {
  const example = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
  assert.ok(example.includes('GEMINI_API_KEY'));
  assert.ok(example.includes('GEMINI_IMAGE_MODEL'));
});

test('README documents all tools', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  for (const name of ['gemini-chat', 'gemini-generate-video', 'gemini-text-to-speech', 'gemini-feedback', 'gemini-profile']) {
    assert.ok(readme.includes(name), `README missing ${name}`);
  }
});
