#!/usr/bin/env node

/**
 * Generate test audio for verbatim transcription testing
 * Uses ElevenLabs to create a test audio file with edge cases
 */

console.log('Verbatim Transcription Test Audio Generator');
console.log('==========================================');

// Test text with various edge cases (100 characters to conserve ElevenLabs quota)
const testText = 'Um, so I was like... [laughs] The U-R-L is H-T-T-P-S, you know? Some some things just work.';

console.log('\nTest text (93 characters):');
console.log(testText);

console.log('\nInstructions for testing:');
console.log('1. Use Claude to generate this audio with ElevenLabs:');
console.log(`   "Generate audio saying: ${testText}"`);
console.log('   Save as: /Users/rob/Claude/mcp-servers/gemini-mcp-server/test-verbatim.mp3');
console.log('\n2. Then test transcription with:');
console.log('   node test-verbatim-transcription.js');
console.log('\nThis will test:');
console.log('- Filler words (Um, like, you know)');
console.log('- Emotional expressions ([laughs])');
console.log('- Spelled acronyms (U-R-L, H-T-T-P-S)');
console.log('- Repetitions (some some)');
console.log('- Ellipses (...)');
console.log('- Artifact removal if present');
