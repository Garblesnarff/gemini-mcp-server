import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { jsonSchemaToZod } from '../src/zod-convert.js';
import { defineTools } from '../src/tools/definitions.js';
import { makeCtx } from './helpers.js';

test('converts object schemas with required/optional', () => {
  const s = jsonSchemaToZod({
    type: 'object',
    properties: {
      message: { type: 'string', description: 'hi' },
      count: { type: 'integer', minimum: 1, maximum: 5 },
      tag: { type: 'string', enum: ['a', 'b'] },
      items: { type: 'array', items: { type: 'string' } },
      flag: { type: 'boolean', default: false },
    },
    required: ['message'],
  });
  assert.ok(s instanceof z.ZodObject);
  const parsed = s.parse({ message: 'x', count: 3, tag: 'a', items: ['y'] });
  assert.equal(parsed.flag, false); // default applied
  assert.throws(() => s.parse({}), /message/); // required enforced
  assert.throws(() => s.parse({ message: 'x', count: 9 }), /number/); // maximum enforced
  assert.throws(() => s.parse({ message: 'x', tag: 'z' }), /Invalid option/); // enum enforced
});

test('every tool schema converts and validates', async (t) => {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  for (const tool of defineTools(ctx)) {
    const s = jsonSchemaToZod(tool.inputSchema);
    assert.ok(s instanceof z.ZodObject, `${tool.name}: converts to ZodObject`);
    if (tool.outputSchema) {
      const o = jsonSchemaToZod(tool.outputSchema);
      assert.ok(o instanceof z.ZodObject, `${tool.name}: output schema converts`);
    }
  }
});
