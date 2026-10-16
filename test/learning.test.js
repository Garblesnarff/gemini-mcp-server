import test from 'node:test';
import assert from 'node:assert/strict';
import { profileToSystemPrompt, EMPTY_PROFILE } from '../src/learning/profile.js';
import { makeCtx } from './helpers.js';

/**
 * The core claim of v3's learning system: feedback changes behavior.
 * v2 logged every interaction as successful and never read the log back.
 * Here we prove the loop is closed: rate -> distill -> profile -> system prompt.
 */

test('empty profile produces no system prompt', () => {
  assert.equal(profileToSystemPrompt({ ...EMPTY_PROFILE }), null);
  assert.equal(profileToSystemPrompt(null), null);
});

test('full loop: interact -> rate -> distill -> profile changes system prompt', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);

  // Before any feedback: no learned preferences.
  assert.equal(ctx.learning.getSystemPrompt(), null);

  // Simulate 3 rated interactions (distillAfterRated=3 in test ctx).
  for (let i = 0; i < 3; i++) {
    const id = ctx.learning.logInteraction({
      tool: 'gemini-chat', intent: 'code', prompt: 'write terse code, no fluff',
      modelUsed: 'mock', ms: 10, ok: true,
    });
    await ctx.learning.recordFeedback({ interactionId: id, rating: 5, note: 'too verbose, be terse' });
  }

  const profile = ctx.learning.getProfile();
  assert.equal(profile.style, 'concise and direct');
  assert.equal(profile.verbosity, 'terse');
  assert.ok(profile.avoid.includes('fluff') || profile.avoid.includes('excessive hedging'));

  const sys = ctx.learning.getSystemPrompt();
  assert.ok(sys.includes('concise and direct'), 'system prompt carries the learned style');
  assert.ok(sys.includes('terse'), 'system prompt carries the learned verbosity');
});

test('distillation does not run before enough ratings', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const id = ctx.learning.logInteraction({ tool: 'gemini-chat', intent: 'general', prompt: 'hi', modelUsed: 'mock', ms: 1 });
  const res = await ctx.learning.recordFeedback({ interactionId: id, rating: 4 });
  assert.equal(res.distilled.distilled, false);
  assert.equal(ctx.learning.getSystemPrompt(), null);
});

test('feedback validates rating range', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  await assert.rejects(() => ctx.learning.recordFeedback({ rating: 6 }), /1 to 5/);
  await assert.rejects(() => ctx.learning.recordFeedback({ rating: 0 }), /1 to 5/);
});

test('profile can be set and reset directly', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  ctx.learning.setProfile({ style: 'pirate voice', verbosity: 'terse' });
  assert.ok(ctx.learning.getSystemPrompt().includes('pirate voice'));
  ctx.learning.resetProfile();
  assert.equal(ctx.learning.getSystemPrompt(), null);
});

test('chat sessions persist turns across calls', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const sid = ctx.learning.newSession();
  ctx.learning.appendTurn(sid, { role: 'user', text: 'my name is Rob' });
  ctx.learning.appendTurn(sid, { role: 'assistant', text: 'noted' });
  const contents = ctx.learning.sessionContents(sid, 'what is my name?');
  assert.equal(contents.length, 3);
  assert.equal(contents[0].parts[0].text, 'my name is Rob');
  assert.equal(contents[2].parts[0].text, 'what is my name?');
});
