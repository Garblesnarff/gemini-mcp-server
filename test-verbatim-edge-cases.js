#!/usr/bin/env node

/**
 * Test script for verbatim transcription edge cases
 * Tests the enhanced verbatim mode with various edge cases
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MCPClient } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

// Test text samples (keeping them short to conserve ElevenLabs characters)
const TEST_SAMPLES = [
  {
    name: 'filler_words',
    text: 'Um, so I was like, uh, going to the store and, you know, it was... it was really busy.',
    expectedPatterns: ['Um,', 'uh,', 'like,', 'you know', '...']
  },
  {
    name: 'emotions',
    text: '[laughs] Oh wow, that\'s amazing! [sighs] I guess we should... [clears throat] Sorry, continue.',
    expectedPatterns: ['[laughs]', '[sighs]', '[clears throat]', '...']
  },
  {
    name: 'repetitions',
    text: 'The the thing is, I mean, some some people just don\'t understand.',
    expectedPatterns: ['The the', 'some some']
  },
  {
    name: 'spelled_acronyms',
    text: 'The U-R-L is H-T-T-P-S colon slash slash example dot com',
    expectedPatterns: ['U-R-L', 'H-T-T-P-S'] // Test if these are preserved
  }
];

// Count total characters for ElevenLabs
const totalChars = TEST_SAMPLES.reduce((sum, sample) => sum + sample.text.length, 0);
console.log(`Total characters for ElevenLabs: ${totalChars}`);

async function generateTestAudio(text, filename) {
  console.log(`\nGenerating audio for: ${filename}`);
  console.log(`Text (${text.length} chars): ${text}`);
  
  const outputPath = path.join(__dirname, 'test-audio', filename);
  
  // Ensure test-audio directory exists
  if (!fs.existsSync(path.join(__dirname, 'test-audio'))) {
    fs.mkdirSync(path.join(__dirname, 'test-audio'));
  }
  
  // Use Claude to generate the audio via ElevenLabs MCP
  // This is a placeholder - you'll need to use the actual ElevenLabs MCP tool
  console.log(`Audio would be saved to: ${outputPath}`);
  
  return outputPath;
}

async function testTranscription(audioPath, testName, expectedPatterns) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testName}`);
  console.log(`Audio file: ${audioPath}`);
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.join(__dirname, 'src', 'server.js')],
    env: { ...process.env }
  });

  const client = new MCPClient({
    name: 'test-client',
    version: '1.0.0',
  });

  try {
    await client.connect(transport);
    console.log('Connected to Gemini MCP server');

    // Test with verbatim context
    console.log('\n--- Testing with context="verbatim" ---');
    const verbatimResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'gemini-transcribe-audio',
        arguments: {
          file_path: audioPath,
          context: 'verbatim'
        }
      }
    });
    
    const verbatimText = verbatimResult.content[0].text;
    console.log('Verbatim transcription:');
    console.log(verbatimText);
    
    // Check for expected patterns
    console.log('\nChecking for expected patterns:');
    for (const pattern of expectedPatterns) {
      const found = verbatimText.includes(pattern);
      console.log(`  ${pattern}: ${found ? '✓ FOUND' : '✗ MISSING'}`);
    }
    
    // Check for unwanted artifacts
    console.log('\nChecking for artifacts:');
    const hasArtifacts = /[Pp]+\s*$/.test(verbatimText);
    console.log(`  End artifacts (pppp): ${hasArtifacts ? '✗ PRESENT' : '✓ CLEAN'}`);
    
    // Test without verbatim context for comparison
    console.log('\n--- Testing without verbatim context ---');
    const normalResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'gemini-transcribe-audio',
        arguments: {
          file_path: audioPath
        }
      }
    });
    
    const normalText = normalResult.content[0].text;
    console.log('Normal transcription:');
    console.log(normalText);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await client.close();
  }
}

async function runTests() {
  console.log('Gemini MCP Verbatim Transcription Edge Case Tests');
  console.log('='.repeat(60));
  console.log(`Total test samples: ${TEST_SAMPLES.length}`);
  console.log(`Total ElevenLabs characters needed: ${totalChars}`);
  console.log('='.repeat(60));
  
  // For now, we'll use existing test audio files
  // In practice, you would generate these with ElevenLabs
  
  console.log('\nNote: This test requires audio files to be generated.');
  console.log('Due to ElevenLabs character limits, please:');
  console.log('1. Use existing test audio files, or');
  console.log('2. Generate specific test cases as needed');
  
  // Example test with an existing audio file
  const testAudioPath = path.join(__dirname, 'test-audio', 'test-verbatim.mp3');
  if (fs.existsSync(testAudioPath)) {
    await testTranscription(testAudioPath, 'General Verbatim Test', ['um', 'uh', '...']);
  } else {
    console.log('\nNo test audio files found. Please generate test audio first.');
  }
}

// Run the tests
runTests().catch(console.error);
