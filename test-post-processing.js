#!/usr/bin/env node

/**
 * Unit test for verbatim transcription post-processing
 * Tests the cleanVerbatimTranscription function directly
 */

// Mock the cleanVerbatimTranscription function (copied from audio-transcription.js)
function cleanVerbatimTranscription(text) {
  // Remove common end-of-file artifacts (pppp, Ppppppppppp)
  text = text.replace(/\s*[Pp]+\s*$/, '');
  
  // Fix spacing before punctuation
  text = text.replace(/\s+([.!?,;:])/g, '$1');
  
  // Fix common emotional expressions that may have lost brackets
  const emotions = [
    'laughs?', 'laugh', 'laughing',
    'sighs?', 'sigh', 'sighing',
    'clears? throat', 'clearing throat',
    'coughs?', 'cough', 'coughing',
    'sniffles?', 'sniffle', 'sniffling',
    'pauses?', 'pause', 'pausing',
    'giggles?', 'giggle', 'giggling',
    'whispers?', 'whisper', 'whispering',
    'yells?', 'yell', 'yelling',
    'groans?', 'groan', 'groaning',
    'gasps?', 'gasp', 'gasping',
    'chuckles?', 'chuckle', 'chuckling',
    'frustrated sigh', 'heavy sigh', 'deep sigh',
    'nervous laugh', 'awkward laugh'
  ];
  const emotionRegex = new RegExp(`\\b(${emotions.join('|')})\\b`, 'gi');
  text = text.replace(emotionRegex, '[$1]');
  
  // Ensure ellipses are preserved properly
  text = text.replace(/\s+\.\s+\.\s+\./g, '...');
  
  // Clean up any double spaces
  text = text.replace(/\s{2,}/g, ' ');
  
  return text.trim();
}

// Test cases
const testCases = [
  {
    name: 'Remove pppp artifacts',
    input: 'This is a test transcription. Ppppppppppp',
    expected: 'This is a test transcription.'
  },
  {
    name: 'Remove pppp artifacts (lowercase)',
    input: 'Another test here. pppp',
    expected: 'Another test here.'
  },
  {
    name: 'Fix emotional expressions without brackets',
    input: 'laughs Oh wow that is so funny sighs I guess',
    expected: '[laughs] Oh wow that is so funny [sighs] I guess'
  },
  {
    name: 'Fix multiple emotional expressions',
    input: 'He was laughing and then he paused before clearing throat',
    expected: 'He was [laughing] and then he [paused] before [clearing throat]'
  },
  {
    name: 'Fix spacing before punctuation',
    input: 'Wait , what ? That is ... weird .',
    expected: 'Wait, what? That is... weird.'
  },
  {
    name: 'Fix ellipses formatting',
    input: 'I was going to . . . never mind',
    expected: 'I was going to... never mind'
  },
  {
    name: 'Complex case with multiple issues',
    input: 'Um so I was like laughs going to the store , right ? And then . . . frustrated sigh it crashed. Ppppppppppp',
    expected: 'Um so I was like [laughs] going to the store, right? And then... [frustrated sigh] it crashed.'
  },
  {
    name: 'Clean up double spaces',
    input: 'This  has   multiple    spaces',
    expected: 'This has multiple spaces'
  },
  {
    name: 'Preserve verbatim content',
    input: 'Um, like, you know, I was, uh, thinking about it',
    expected: 'Um, like, you know, I was, uh, thinking about it'
  }
];

// Run tests
console.log('Testing cleanVerbatimTranscription function\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = cleanVerbatimTranscription(test.input);
  const success = result === test.expected;
  
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`  Input:    "${test.input}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log(`  Status:   ${success ? '✓ PASS' : '✗ FAIL'}`);
  console.log('');
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\nSummary: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('✓ All tests passed!');
} else {
  console.log('✗ Some tests failed.');
  process.exit(1);
}
