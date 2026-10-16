#!/usr/bin/env node
/**
 * gemini-mcp — CLI entry point.
 *
 *   node bin/gemini-mcp.js              # stdio (Claude Desktop)
 *   node bin/gemini-mcp.js --http       # Streamable HTTP on :3100
 *   node bin/gemini-mcp.js --http --port 8080
 */
import { config, assertConfigured, maskKey } from '../src/config.js';
import { createGemini } from '../src/gemini.js';
import { createLearningSystem } from '../src/learning/index.js';
import { runStdio, runHttp, SERVER_VERSION } from '../src/server.js';

const args = process.argv.slice(2);
const useHttp = args.includes('--http');
const portIdx = args.indexOf('--port');
const port = portIdx >= 0 ? Number.parseInt(args[portIdx + 1], 10) : config.httpPort;

function log(...parts) {
  if (config.debug) console.error('[gemini-mcp]', ...parts);
}

async function main() {
  assertConfigured();

  const gemini = createGemini({ apiKey: config.apiKey, log });
  const learning = createLearningSystem({
    dataDir: config.dataDir,
    gemini,
    models: config.models,
    distillAfterRated: config.learning.distillAfterRated,
    log,
  });

  const ctx = {
    gemini,
    learning,
    config,
    outputDir: config.outputDir,
    log,
  };

  console.error(`gemini-mcp-server v${SERVER_VERSION} — key ${maskKey(config.apiKey)}, models: chat=${config.models.chat} image=${config.models.image}`);
  if (useHttp) await runHttp(ctx, port);
  else await runStdio(ctx);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
