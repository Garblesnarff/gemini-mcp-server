/**
 * Example of using gemini-mcp-server programmatically
 */
const { createServer, Config } = require('gemini-mcp-server');

// Create a custom configuration
const customConfig = new Config({
  defaults: {
    apiKey: 'YOUR_GEMINI_API_KEY_HERE',
    outputDir: './generated-images',
    debug: true,
    modelOptions: {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
    }
  }
});

// Override with environment variables if available
customConfig.loadFromEnv();

// Create server with the custom configuration
const server = createServer({ configOptions: customConfig });

// You can also access and modify the configuration directly
console.log(`Using API key: ${server.config.apiKey.substring(0, 8)}...`);
console.log(`Output directory: ${server.config.outputDir}`);

// Example of handling a specific request
async function testRequest() {
  console.log('Sending test initialize request...');
  
  // Simulate an initialize request
  await server.handleRequest(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize'
  }));
  
  console.log('Sending test tools/list request...');
  
  // Simulate a tools/list request
  await server.handleRequest(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  }));
  
  console.log('Sending test tools/call request...');
  
  // Simulate a generate_image request
  await server.handleRequest(JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'generate_image',
      arguments: {
        prompt: 'A beautiful mountain landscape at sunset',
        temperature: 0.7,
        style: 'realistic'
      }
    }
  }));
}

// Run the test if directly executed
if (require.main === module) {
  // Override console.log to show responses
  const originalLog = console.log;
  console.log = (message) => {
    try {
      // Try to parse as JSON (responses from the server)
      const parsed = JSON.parse(message);
      originalLog('\nServer response:');
      originalLog(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Not JSON, just log normally
      originalLog(message);
    }
  };
  
  testRequest().catch(error => {
    console.error('Error during test:', error);
  });
} else {
  // Start the server when imported
  server.start();
}
