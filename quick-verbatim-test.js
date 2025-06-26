const intelligenceSystem = require('./src/intelligence');

// Quick test to show how verbatim mode works
async function quickTest() {
  await intelligenceSystem.initialize();

  const testPrompt = 'Please transcribe this audio file accurately. Provide the complete text of what is spoken.';

  console.log('Original prompt:', testPrompt);
  console.log('\n--- With normal context ---');
  const normal = await intelligenceSystem.enhancePrompt(testPrompt, null);
  console.log('Enhanced:', normal);

  console.log('\n--- With verbatim context ---');
  const verbatim = await intelligenceSystem.enhancePrompt(testPrompt, 'verbatim');
  console.log('Enhanced:', verbatim);
}

quickTest().catch(console.error);
