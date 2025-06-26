#!/usr/bin/env node

/**
 * Quick demonstration of the fixed verbatim transcription mode
 */

console.log('Verbatim Transcription Demo');
console.log('===========================\n');

console.log('Test audio created: test-verbatim.mp3');
console.log('Contains: filler words, emotions, spelled acronyms, repetitions\n');

console.log('To test the verbatim transcription:');
console.log('1. Restart the Gemini MCP server in Claude Desktop');
console.log('2. Use the gemini-transcribe-audio tool with:');
console.log('   - file_path: /Users/rob/Claude/mcp-servers/gemini-mcp-server/test-verbatim.mp3');
console.log('   - context: "verbatim"');
console.log('   - preserve_spelled_acronyms: true\n');

console.log('Expected results:');
console.log('✓ "Um" and "you know" preserved (not removed)');
console.log('✓ "[laughs]" with brackets (not just "laughs")');
console.log('✓ "U-R-L" and "H-T-T-P-S" hyphenated (not URL/HTTPS)');
console.log('✓ "some some" repetition kept');
console.log('✓ "..." ellipsis preserved');
console.log('✓ No "pppp" artifacts at the end\n');

console.log('Compare with normal mode (context: null) to see the difference!');
