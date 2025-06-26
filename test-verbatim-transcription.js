#!/usr/bin/env node

/**
 * Test verbatim transcription with real audio
 * Tests the enhanced verbatim mode implementation
 */

const { spawn } = require('child_process');
const path = require('path');

async function testVerbatimTranscription() {
  console.log('Verbatim Transcription Test');
  console.log('===========================\n');

  const serverPath = path.join(__dirname, 'src', 'server.js');
  const testAudioPath = path.join(__dirname, 'test-verbatim.mp3');

  console.log('Starting Gemini MCP server...');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Testing verbatim transcription...\n');

  // Create test request
  const testRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'gemini-transcribe-audio',
      arguments: {
        file_path: testAudioPath,
        context: 'verbatim',
        preserve_spelled_acronyms: true
      }
    },
    id: 1
  };

  // Send request to server
  server.stdin.write(JSON.stringify(testRequest) + '\n');

  // Collect response
  let responseData = '';
  server.stdout.on('data', (data) => {
    responseData += data.toString();
    const lines = responseData.split('\n');
    
    for (const line of lines) {
      if (line.trim() && line.includes('"jsonrpc"')) {
        try {
          const response = JSON.parse(line);
          if (response.result) {
            console.log('Verbatim Transcription Result:');
            console.log('==============================');
            const content = response.result.content[0].text;
            // Extract just the transcription part
            const transcriptionMatch = content.match(/\*\*Transcription:\*\*\n(.+)/s);
            if (transcriptionMatch) {
              const transcription = transcriptionMatch[1].split('\n\n---')[0];
              console.log(transcription);
              
              // Check for expected patterns
              console.log('\nChecking for expected patterns:');
              console.log('- Filler words (Um):', transcription.includes('Um') ? '✓' : '✗');
              console.log('- Emotional expressions ([laughs]):', transcription.includes('[laughs]') ? '✓' : '✗');
              console.log('- Spelled acronyms (U-R-L):', transcription.includes('U-R-L') ? '✓' : '✗');
              console.log('- Repetitions (some some):', transcription.includes('some some') ? '✓' : '✗');
              console.log('- No artifacts (pppp):', !transcription.match(/[Pp]+\s*$/) ? '✓' : '✗');
            }
          } else if (response.error) {
            console.error('Error:', response.error);
          }
        } catch (e) {
          // Not a complete JSON response yet
        }
      }
    }
  });

  // Handle errors
  server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Clean up
  server.kill();
  console.log('\nTest complete.');
}

// Run the test
testVerbatimTranscription().catch(console.error);
