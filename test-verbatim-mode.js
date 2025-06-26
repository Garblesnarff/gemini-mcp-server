#!/usr/bin/env node

/**
 * Test script to verify verbatim transcription mode
 */

const path = require('path');
const IntelligenceSystem = require('../src/intelligence');

async function testVerbatimMode() {
  console.log('=== Testing Verbatim Transcription Mode ===\n');
  
  // Initialize the intelligence system
  const intelligenceSystem = IntelligenceSystem;
  await intelligenceSystem.initialize();
  
  // Test cases
  const testCases = [
    {
      name: 'Normal transcription (no context)',
      prompt: 'Please transcribe this audio file accurately. Provide the complete text of what is spoken.',
      context: null,
    },
    {
      name: 'Medical context transcription',
      prompt: 'Please transcribe this audio file accurately. Provide the complete text of what is spoken.',
      context: 'medical',
    },
    {
      name: 'Verbatim context transcription',
      prompt: 'Please transcribe this audio file accurately. Provide the complete text of what is spoken.',
      context: 'verbatim',
    },
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Original prompt: "${testCase.prompt}"`);
    console.log(`Context: ${testCase.context || 'none'}`);
    
    const enhancedPrompt = await intelligenceSystem.enhancePrompt(testCase.prompt, testCase.context);
    
    console.log(`Enhanced prompt: "${enhancedPrompt}"`);
    console.log('-'.repeat(80));
  }
  
  console.log('\n✅ Verbatim mode test complete!');
  console.log('\nExpected behavior:');
  console.log('- Normal context: Should add style and requirements');
  console.log('- Medical context: Should add appropriate medical style');
  console.log('- Verbatim context: Should add word-for-word transcription instructions');
}

// Run the test
testVerbatimMode().catch(console.error);
