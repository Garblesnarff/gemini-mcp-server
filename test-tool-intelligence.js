#!/usr/bin/env node
/**
 * Test Gemini MCP server with Tool Intelligence
 */

const { spawn } = require('child_process');

console.log('Testing Gemini MCP server with Tool Intelligence...');

// Start the server
const server = spawn('node', ['/Users/rob/Claude/mcp-servers/gemini-server.js'], {
  env: {
    ...process.env,
    GEMINI_API_KEY: 'AIzaSyD6Ki3ZtL19-Km9y8EQcywZvHJLDiRDyNk',
    DEBUG: 'true',
  },
});

// Handle stderr (debug output)
server.stderr.on('data', (data) => {
  console.error(`[DEBUG] ${data.toString().trim()}`);
});

// Handle stdout (server responses)
server.stdout.on('data', (data) => {
  console.log(`[RESPONSE] ${data.toString().trim()}`);
});

// Send initialize request
setTimeout(() => {
  console.log('\n[TEST] Sending initialize request...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {},
  })}\n`);
}, 1000);

// Send tools/list request
setTimeout(() => {
  console.log('\n[TEST] Sending tools/list request...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  })}\n`);
}, 2000);

// Test gemini-chat with aurora context (consciousness research)
setTimeout(() => {
  console.log('\n[TEST] Testing gemini-chat with aurora context...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'gemini-chat',
      arguments: {
        message: 'What is consciousness emergence in AI?',
        context: 'aurora',
      },
    },
  })}\n`);
}, 3000);

// Test gemini-chat with code context
setTimeout(() => {
  console.log('\n[TEST] Testing gemini-chat with code context...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'gemini-chat',
      arguments: {
        message: 'How do I implement a singleton pattern?',
        context: 'code',
      },
    },
  })}\n`);
}, 10000);

// Exit after tests
setTimeout(() => {
  console.log('\n[TEST] Tests completed. Shutting down server...');
  server.kill();
  process.exit(0);
}, 20000);
