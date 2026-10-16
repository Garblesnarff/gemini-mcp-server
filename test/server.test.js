import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer, SERVER_NAME, SERVER_VERSION } from '../src/server.js';
import { makeCtx } from './helpers.js';

/**
 * Full MCP protocol roundtrip over an in-memory transport:
 * proves the tools/list + tools/call surface works through the real SDK,
 * replacing v2's hand-rolled JSON-RPC.
 */
async function connectedPair(t) {
  const { ctx, cleanup } = makeCtx();
  t.after(cleanup);
  const server = createMcpServer(ctx);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return { client, ctx };
}

test('server identifies itself and lists 15 tools', async (t) => {
  const { client } = await connectedPair(t);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 15);
  const chat = tools.find((x) => x.name === 'gemini-chat');
  assert.ok(chat.description.length > 10);
  assert.ok(chat.annotations, 'annotations advertised');
  assert.ok(chat.inputSchema, 'input schema advertised');
});

test('tools/call works end-to-end over MCP', async (t) => {
  const { client } = await connectedPair(t);
  const res = await client.callTool({ name: 'gemini-profile', arguments: { action: 'stats' } });
  assert.ok(!res.isError);
  assert.ok(res.content[0].text.includes('interactions'));
});

test('unknown tool call returns an error result', async (t) => {
  const { client } = await connectedPair(t);
  const res = await client.callTool({ name: 'nope-not-a-tool', arguments: {} });
  assert.equal(res.isError, true);
});

test('structured output is returned when outputSchema is defined', async (t) => {
  const { client } = await connectedPair(t);
  const res = await client.callTool({ name: 'gemini-chat', arguments: { message: 'hi' } });
  assert.ok(res.structuredContent, 'structuredContent present');
  assert.equal(res.structuredContent.reply, 'mock reply');
  assert.ok(res.structuredContent.session_id);
});

test('learning profile resource is readable', async (t) => {
  const { client } = await connectedPair(t);
  const res = await client.readResource({ uri: 'gemini://profile/current' });
  const profile = JSON.parse(res.contents[0].text);
  assert.equal(profile.version, 1);
});

test('server name/version', () => {
  assert.equal(SERVER_NAME, 'gemini-mcp-server');
  assert.equal(SERVER_VERSION, '3.0.0');
});
