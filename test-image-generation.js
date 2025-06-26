#!/usr/bin/env node
/**
 * Test script for Gemini image generation functionality
 * Tests the fixed implementation with proper model and config
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing Gemini Image Generation Fix ===\n');

// Start the server
const server = spawn('node', [path.join(__dirname, 'gemini-server.js')], {
  env: {
    ...process.env,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyD6Ki3ZtL19-Km9y8EQcywZvHJLDiRDyNk',
    DEBUG: 'true',
    OUTPUT_DIR: path.join(process.env.HOME, 'Claude', 'resources', 'gemini-images'),
  },
});

let responseReceived = false;

// Handle stderr (debug output)
server.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output.includes('[gemini-service]') || output.includes('[generate_image]')) {
    console.log(`[DEBUG] ${output}`);
  }
});

// Handle stdout (server responses)
server.stdout.on('data', (data) => {
  try {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) {
        const response = JSON.parse(line);
        if (response.id === 3) {
          responseReceived = true;
          console.log('\n=== Image Generation Response ===');
          if (response.result?.content?.[0]?.text) {
            console.log(response.result.content[0].text);
            if (response.result.content[0].text.includes('successfully generated')) {
              console.log('\n✅ SUCCESS: Image generation is now working!');
            } else {
              console.log('\n❌ FAIL: Image generation still not working');
            }
          } else if (response.error) {
            console.log('Error:', response.error.message);
            console.log('\n❌ FAIL: Got error response');
          }
        }
      }
    });
  } catch (e) {
    // Ignore parsing errors for partial data
  }
});

// Send test request
const runTest = async () => {
  console.log('[INIT] Initializing server...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {},
  })}\n`);

  await sleep(1000);

  // Get tools
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  })}\n`);

  await sleep(1000);

  // Test image generation
  console.log('\n[TEST] Testing image generation with artistic context...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'generate_image',
      arguments: {
        prompt: 'A beautiful serene mountain landscape at sunset with vibrant colors',
        context: 'artistic',
      },
    },
  })}\n`);

  // Wait for response
  await sleep(10000);

  if (!responseReceived) {
    console.log('\n⚠️  No response received within 10 seconds');
  }

  console.log('\n[DONE] Test completed. Shutting down server...');
  server.kill();
  process.exit(0);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Run test
setTimeout(runTest, 500);
