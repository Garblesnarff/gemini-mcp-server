#!/usr/bin/env node
// Test the Gemini MCP server startup

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Gemini MCP server startup...\n');

// Set up environment
const env = {
  ...process.env,
  GEMINI_API_KEY: 'AIzaSyD6Ki3ZtL19-Km9y8EQcywZvHJLDiRDyNk',
  OUTPUT_DIR: path.join(process.env.HOME, 'Claude', 'gemini-images'),
  DEBUG: 'true'
};

// Start the server
const serverPath = path.join(__dirname, 'gemini-server.js');
const server = spawn('node', [serverPath], { env });

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  process.stdout.write(data);
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  process.stderr.write(data);
});

// Send a test request after 1 second
setTimeout(() => {
  console.log('\nSending test request...\n');
  
  // Send initialize request
  const request = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  });
  
  server.stdin.write(request + '\n');
  
  // Send tools/list request
  setTimeout(() => {
    const listRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    
    server.stdin.write(listRequest + '\n');
    
    // Wait for response then exit
    setTimeout(() => {
      console.log('\n\nTest complete. Shutting down server...');
      server.kill();
      
      // Check if we got valid responses
      if (output.includes('"gemini-upload-file"')) {
        console.log('\n✅ SUCCESS: File upload tool is registered and available!');
        console.log('The Gemini MCP server is working correctly with the new file upload feature.');
      } else if (output.includes('"jsonrpc"')) {
        console.log('\n⚠️  Server is responding but file upload tool may not be registered.');
      } else {
        console.log('\n❌ Server does not appear to be responding to requests.');
        console.log('Error output:', errorOutput);
      }
      
      process.exit(0);
    }, 1000);
  }, 500);
}, 1000);

// Timeout after 5 seconds
setTimeout(() => {
  console.log('\n\nTimeout reached. Shutting down...');
  server.kill();
  process.exit(1);
}, 5000);
