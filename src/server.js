/**
 * Gemini MCP Server v3 — MCP layer.
 *
 * Uses the official @modelcontextprotocol/sdk (no more hand-rolled JSON-RPC):
 *   - StdioServerTransport (default, for Claude Desktop / local hosts)
 *   - StreamableHTTPServerTransport via Express (--http, for remote use)
 *
 * Also exposes the learned profile as a resource so it's inspectable.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { defineTools } from './tools/definitions.js';
import { jsonSchemaToZod } from './zod-convert.js';

export const SERVER_NAME = 'gemini-mcp-server';
export const SERVER_VERSION = '3.0.0';

export function createMcpServer(ctx) {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: { listChanged: false }, resources: {} } }
  );

  for (const tool of defineTools(ctx)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: jsonSchemaToZod(tool.inputSchema),
        ...(tool.outputSchema ? { outputSchema: jsonSchemaToZod(tool.outputSchema) } : {}),
        annotations: tool.annotations,
      },
      async (args) => {
        try {
          return await tool.run(args ?? {});
        } catch (err) {
          ctx.log(`Tool ${tool.name} threw: ${err.message}`);
          return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
      }
    );
  }

  // Inspectable learned profile (transparency for the learning system).
  server.registerResource(
    'learning-profile',
    'gemini://profile/current',
    { title: 'Learned user profile', description: 'What the server has learned from your feedback, as JSON.', mimeType: 'application/json' },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(ctx.learning.getProfile(), null, 2),
      }],
    })
  );

  return server;
}

export async function runStdio(ctx) {
  const server = createMcpServer(ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  ctx.log('Gemini MCP server v3 listening on stdio');
}

export async function runHttp(ctx, port) {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // One MCP server + transport per client session (SDK's documented pattern).
  const sessions = new Map();

  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    try {
      let transport;
      if (sessionId && sessions.has(sessionId)) {
        transport = sessions.get(sessionId);
      } else {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => sessions.set(sid, transport),
          onsessionclosed: (sid) => sessions.delete(sid),
        });
        const server = createMcpServer(ctx);
        await server.connect(transport);
      }
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      ctx.log(`HTTP MCP error: ${err.message}`);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  });

  app.get('/health', (_req, res) => res.json({ ok: true, server: SERVER_NAME, version: SERVER_VERSION }));

  await new Promise((resolve) => app.listen(port, resolve));
  ctx.log(`Gemini MCP server v3 listening on http://localhost:${port}/mcp`);
}
