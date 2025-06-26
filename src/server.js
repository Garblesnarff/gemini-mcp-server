/**
 * Main MCP server entry point for Gemini.
 * Handles MCP protocol communication (stdin/stdout) and dispatches requests.
 *
 * @author Cline
 */

const readline = require('readline');
const { log } = require('./utils/logger');
const config = require('./config');
const { ensureDirectoryExists } = require('./utils/file-utils');
const { getToolListMetadata, dispatchToolCall, intelligenceSystem } = require('./tools'); // Import tool registry and intelligence system

// Ensure output directory exists
ensureDirectoryExists(config.OUTPUT_DIR, 'server');

// Send JSON-RPC response to stdout
function sendResponse(response) {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

// Define a map for request handlers to improve scalability
const requestHandlers = new Map();

requestHandlers.set('initialize', async (id, params) => ({
  jsonrpc: '2.0',
  id,
  result: {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: 'gemini',
      version: '2.0.0',
    },
    capabilities: {
      experimental: {},
      tools: {
        listChanged: false,
      },
    },
  },
}));

requestHandlers.set('tools/list', async (id, params) => ({
  jsonrpc: '2.0',
  id,
  result: {
    tools: getToolListMetadata(),
  },
}));

requestHandlers.set('tools/call', async (id, params) => {
  const { name, arguments: args } = params;
  try {
    const toolResult = await dispatchToolCall(name, args);
    return {
      jsonrpc: '2.0',
      id,
      result: toolResult,
    };
  } catch (error) {
    log(`Error calling tool '${name}': ${error.message}`, 'server');
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000, // Internal error
        message: `Error calling tool '${name}': ${error.message}`,
      },
    };
  }
});

requestHandlers.set('resources/list', async (id, params) => ({
  jsonrpc: '2.0',
  id,
  error: {
    code: -32601,
    message: 'Method not found',
  },
}));

requestHandlers.set('prompts/list', async (id, params) => ({
  jsonrpc: '2.0',
  id,
  error: {
    code: -32601,
    message: 'Method not found',
  },
}));

requestHandlers.set('notifications/initialized', async (id, params) => {
  log('Received notification: notifications/initialized', 'server');
  // No response for notifications
  return null;
});

/**
 * Processes an incoming JSON-RPC request.
 * @param {Object} request - The parsed JSON-RPC request object.
 */
async function processRequest(request) {
  log(`Processing request: ${JSON.stringify(request)}`, 'server');
  const { id, method, params } = request;

  const handler = requestHandlers.get(method);
  if (handler) {
    const response = await handler(id, params);
    if (response) { // Only send response if handler returns one (e.g., not for notifications)
      sendResponse(response);
    }
  } else {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    });
  }
}

/**
 * Starts the MCP server, listening for requests on stdin.
 */
async function startServer() {
  log('Gemini MCP server (with Smart Tool Intelligence) started - listening on stdin', 'server');

  // Initialize the singleton intelligence system
  await intelligenceSystem.initialize();

  if (intelligenceSystem.initialized) {
    log('The gemini-chat tool now learns your preferences and applies them automatically', 'server');
  } else {
    log('Tool Intelligence is disabled - running in basic mode', 'server');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  rl.on('line', async (line) => {
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        await processRequest(request);
      } catch (error) {
        log(`Error parsing request: ${error.message}`, 'server');
        try {
          const request = JSON.parse(line);
          if (request.id) {
            sendResponse({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32700,
                message: `Parse error: ${error.message}`,
              },
            });
          }
        } catch (e) {
          log(`Couldn't parse request at all: ${e.message}`, 'server');
        }
      }
    }
  });

  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down', 'server');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down', 'server');
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'server');
    log(error.stack, 'server');
  });
}

module.exports = {
  startServer,
};
