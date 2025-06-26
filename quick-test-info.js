#!/usr/bin/env node

/**
 * Quick test of verbatim transcription
 */

const fs = require('fs');
const path = require('path');

console.log('Quick Verbatim Transcription Test');
console.log('=================================\n');

// Check if test audio exists
const audioPath = path.join(__dirname, 'test-verbatim.mp3');
if (fs.existsSync(audioPath)) {
  console.log('✓ Test audio file found:', audioPath);
  const stats = fs.statSync(audioPath);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
} else {
  console.log('✗ Test audio file not found!\n');
}

console.log('To test verbatim transcription in Claude:');
console.log('1. Use the Gemini transcribe audio tool');
console.log('2. Set file_path to:', audioPath);
console.log('3. Set context to: "verbatim"');
console.log('4. Set preserve_spelled_acronyms to: true\n');

console.log('The audio contains:');
console.log('- Filler words: "Um", "like", "you know"');
console.log('- Emotion: "[laughs]"');
console.log('- Spelled acronyms: "U-R-L", "H-T-T-P-S"');
console.log('- Repetition: "some some"');
console.log('- Ellipsis: "..."');
