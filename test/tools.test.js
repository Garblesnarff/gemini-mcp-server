import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { defineTools } from '../src/tools/definitions.js';
import { makeCtx } from './helpers.js';

function toolMap(ctx) {
  return new Map(defineTools(ctx).map((t) => [t.name, t]));
}

test('all 15 tools are defined with valid metadata', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const tools = defineTools(ctx);
  assert.equal(tools.length, 15);
  const names = tools.map((t) => t.name);
  for (const expected of [
    'gemini-chat', 'gemini-generate-image', 'gemini-edit-image', 'gemini-generate-image-pro',
    'gemini-generate-video', 'gemini-poll-video', 'gemini-text-to-speech',
    'gemini-transcribe-audio', 'gemini-analyze-image', 'gemini-analyze-video',
    'gemini-code-execute', 'gemini-upload-file', 'gemini-search',
    'gemini-feedback', 'gemini-profile',
  ]) {
    assert.ok(names.includes(expected), `missing tool ${expected}`);
  }
  for (const tool of tools) {
    assert.ok(tool.title, `${tool.name}: title`);
    assert.ok(tool.description, `${tool.name}: description`);
    assert.equal(tool.inputSchema.type, 'object', `${tool.name}: inputSchema`);
    assert.ok(tool.annotations, `${tool.name}: annotations`);
    assert.equal(typeof tool.run, 'function', `${tool.name}: run`);
  }
});

test('chat tool: multi-turn session + interaction logged', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  const r1 = await tools.get('gemini-chat').run({ message: 'hello' });
  assert.equal(r1.content[0].text, 'mock reply');
  assert.ok(r1.structuredContent.session_id);
  assert.equal(r1._meta.intent, 'general');

  const r2 = await tools.get('gemini-chat').run({ message: 'again', session_id: r1.structuredContent.session_id });
  assert.equal(r2.structuredContent.session_id, r1.structuredContent.session_id);
  assert.equal(ctx.learning.interactionCount(), 2);
});

test('image tool saves a file and returns image content', async (t) => {
  const { ctx, cleanup, outputDir } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  const r = await tools.get('gemini-generate-image').run({ prompt: 'a red square' });
  assert.ok(r.content.some((c) => c.type === 'image'), 'has image content block');
  const saved = r.structuredContent.path;
  assert.ok(saved.startsWith(outputDir));
  assert.ok(fs.existsSync(saved), 'file written to output dir');
});

test('transcribe verbatim mode works', async (t) => {
  const { ctx, cleanup, tmp } = makeCtx();
  t.after(cleanup);
  const wav = path.join(tmp, 'clip.wav');
  fs.writeFileSync(wav, Buffer.alloc(100));
  const tools = toolMap(ctx);
  const r = await tools.get('gemini-transcribe-audio').run({ file_path: wav, verbatim: true });
  assert.ok(r.structuredContent.text.includes('um'), 'verbatim transcript keeps filler words');
  assert.equal(r.structuredContent.verbatim, true);
});

test('feedback tool rates the last interaction', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  await tools.get('gemini-chat').run({ message: 'hi' });
  const r = await tools.get('gemini-feedback').run({ rating: 5, note: 'great' });
  assert.equal(r.structuredContent.distilled, false); // only 1 rating so far
  assert.equal(ctx.learning.ratedCount(), 1);
});

test('profile tool: get/set/stats', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  const get = await tools.get('gemini-profile').run({ action: 'get' });
  assert.ok(get.content[0].text.includes('Learned profile'));
  const set = await tools.get('gemini-profile').run({ action: 'set', profile: { style: 'dry wit' } });
  assert.ok(set.content[0].text.includes('dry wit'));
  const stats = await tools.get('gemini-profile').run({ action: 'stats' });
  assert.ok(stats.content[0].text.includes('interactions'));
});

test('video start + poll roundtrip (mocked)', async (t) => {
  const { ctx, cleanup, outputDir } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  const started = await tools.get('gemini-generate-video').run({ prompt: 'ocean waves' });
  assert.equal(started.structuredContent.status, 'started');
  const polled = await tools.get('gemini-poll-video').run({ operation_id: started.structuredContent.operation_id });
  assert.equal(polled.structuredContent.done, true);
  assert.ok(polled.structuredContent.path.startsWith(outputDir));
  assert.ok(fs.existsSync(polled.structuredContent.path));
});

test('tts saves audio and returns audio content', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  const r = await tools.get('gemini-text-to-speech').run({ text: 'hello world' });
  assert.ok(r.content.some((c) => c.type === 'audio'));
  assert.ok(fs.existsSync(r.structuredContent.path));
});

test('search returns answer + sources structure', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  const r = await tools.get('gemini-search').run({ query: 'what is MCP?' });
  assert.ok(r.structuredContent.answer.length > 0);
  assert.ok(Array.isArray(r.structuredContent.sources));
});

test('missing file returns an error result, not a throw', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const tools = toolMap(ctx);
  const r = await tools.get('gemini-analyze-image').run({ file_path: '/does/not/exist.png' });
  assert.equal(r.isError, true);
  assert.ok(r.content[0].text.includes('not found'));
});
