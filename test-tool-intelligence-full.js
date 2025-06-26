#!/usr/bin/env node
/**
 * Manual test for Gemini MCP server with Tool Intelligence
 * This tests all the enhancement scenarios
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing Gemini MCP Server with Smart Tool Intelligence ===\n');

// Start the server
const server = spawn('node', [path.join(__dirname, 'gemini-server.js')], {
  env: {
    ...process.env,
    GEMINI_API_KEY: 'AIzaSyD6Ki3ZtL19-Km9y8EQcywZvHJLDiRDyNk',
    DEBUG: 'true',
    OUTPUT_DIR: path.join(process.env.HOME, 'Claude', 'gemini-images'),
  },
});

const testResults = [];

// Handle stderr (debug output)
server.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output.includes('[tool-intelligence]') || output.includes('Tool Intelligence')) {
    console.log(`✓ Tool Intelligence: ${output}`);
  } else if (process.env.VERBOSE) {
    console.error(`[DEBUG] ${output}`);
  }
});

// Handle stdout (server responses)
server.stdout.on('data', (data) => {
  try {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) {
        const response = JSON.parse(line);
        if (response.id >= 3 && response.result?.content?.[0]?.text) {
          const { text } = response.result.content[0];
          const testName = getTestName(response.id);
          console.log(`\n=== ${testName} ===`);
          console.log('Response preview:', `${text.substring(0, 200)}...\n`);

          // Check if enhancement was applied
          if (text.includes('Enhancement applied based on context:')) {
            console.log('✓ Tool Intelligence enhancement detected!');
            testResults.push({ test: testName, enhanced: true });
          } else {
            testResults.push({ test: testName, enhanced: false });
          }
        }
      }
    });
  } catch (e) {
    // Ignore parsing errors for partial data
  }
});

const getTestName = (id) => {
  const tests = {
    3: 'Test 1: Consciousness Research (Aurora Context)',
    4: 'Test 2: Code Implementation Request',
    5: 'Test 3: Debugging Assistance',
    6: 'Test 4: General Query (No Special Context)',
  };
  return tests[id] || `Test ${id}`;
};

// Send requests sequentially
const runTests = async () => {
  // Initialize
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

  // Test 1: Consciousness research with aurora context
  console.log('\n[TEST 1] Testing consciousness research enhancement...');
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

  await sleep(5000);

  // Test 2: Code context (implicit detection)
  console.log('\n[TEST 2] Testing code enhancement...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'gemini-chat',
      arguments: {
        message: 'How do I implement a singleton pattern in Python?',
        context: 'code',
      },
    },
  })}\n`);

  await sleep(5000);

  // Test 3: Debugging context
  console.log('\n[TEST 3] Testing debugging enhancement...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'gemini-chat',
      arguments: {
        message: 'My MCP server is not loading in Claude Desktop, how do I debug this?',
        context: 'debugging',
      },
    },
  })}\n`);

  await sleep(5000);

  // Test 4: General query
  console.log('\n[TEST 4] Testing general query (no special enhancement)...');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'gemini-chat',
      arguments: {
        message: 'What is the weather like today?',
        // No context provided
      },
    },
  })}\n`);

  await sleep(5000);

  // Show results
  console.log('\n=== Test Results Summary ===');
  testResults.forEach((result) => {
    const icon = result.enhanced ? '✓' : '✗';
    console.log(`${icon} ${result.test}: ${result.enhanced ? 'Enhanced' : 'Not enhanced'}`);
  });

  // Check if preferences file was created
  const prefsFile = path.join(process.env.HOME, 'Claude', 'tool-preferences.json');
  // eslint-disable-next-line global-require
  const fs = require('fs');
  if (fs.existsSync(prefsFile)) {
    console.log('\n✓ Tool preferences file created successfully!');
    const prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8'));
    console.log('Stored patterns:', Object.keys(prefs.patterns || {}));
  }

  console.log('\n[DONE] Tests completed. Shutting down server...');
  server.kill();
  process.exit(0);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Run tests
setTimeout(runTests, 500);
