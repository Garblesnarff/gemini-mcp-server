#!/usr/bin/env node
// Quick syntax check for the Gemini MCP server

console.log('Checking Gemini MCP server syntax...\n');

try {
  // Test loading the main server
  console.log('1. Loading server module...');
  require('./src/server');
  console.log('✓ Server module loaded successfully');
  
  // Test loading the file upload service
  console.log('\n2. Loading file upload service...');
  require('./src/gemini/file-api/file-upload-service');
  console.log('✓ File upload service loaded successfully');
  
  // Test loading the file upload tool
  console.log('\n3. Loading file upload tool...');
  require('./src/tools/file-upload');
  console.log('✓ File upload tool loaded successfully');
  
  // Test loading all tools
  console.log('\n4. Loading tool registry...');
  const tools = require('./src/tools');
  console.log('✓ Tool registry loaded successfully');
  console.log(`   Found ${tools.getToolListMetadata().length} tools`);
  
  // List all tools
  console.log('\n5. Available tools:');
  tools.getToolListMetadata().forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description.substring(0, 60)}...`);
  });
  
  console.log('\n✅ All modules loaded successfully!');
  
} catch (error) {
  console.error('\n❌ Error found:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
