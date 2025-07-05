/**
 * Tool registry and dispatcher for Gemini MCP Server.
 * Manages all available tools and dispatches requests to them.
 *
 * @author Cline
 */

const { log } = require('../utils/logger');
const { validateNonEmptyString, validateObject } = require('../utils/validation');
const IntelligenceSystem = require('../intelligence'); // Singleton Intelligence System
const GeminiService = require('../gemini/gemini-service'); // Gemini API Service

// Import individual tool modules
const ImageGenerationTool = require('./image-generation');
const ImageEditingTool = require('./image-editing');
const ChatTool = require('./chat');
const AudioTranscriptionTool = require('./audio-transcription');
const CodeExecutionTool = require('./code-execution');
const VideoAnalysisTool = require('./video-analysis');
const ImageAnalysisTool = require('./image-analysis');
const FileUploadTool = require('./file-upload');

/**
 * @type {Map<string, import('./base-tool')>}
 */
const registeredTools = new Map();

// Initialize singleton instances
const intelligenceSystem = IntelligenceSystem; // Already a singleton due to its export
const geminiService = new GeminiService();

/**
 * Registers a tool with the system.
 * @param {import('./base-tool')} toolInstance - An instance of a class extending BaseTool.
 */
function registerTool(toolInstance) {
  validateObject(toolInstance, 'toolInstance');
  validateNonEmptyString(toolInstance.name, 'toolInstance.name');

  if (registeredTools.has(toolInstance.name)) {
    log(`Tool '${toolInstance.name}' is already registered. Overwriting.`, 'tool-registry');
  }
  registeredTools.set(toolInstance.name, toolInstance);
  log(`Tool '${toolInstance.name}' registered successfully.`, 'tool-registry');
}

/**
 * Retrieves the metadata for all registered tools.
 * @returns {Array<Object>} An array of tool metadata objects.
 */
function getToolListMetadata() {
  return Array.from(registeredTools.values()).map((tool) => tool.getToolMetadata());
}

/**
 * Dispatches a tool call to the appropriate tool.
 * @param {string} toolName - The name of the tool to call.
 * @param {Object} args - The arguments for the tool.
 * @returns {Promise<Object>} The result of the tool execution.
 * @throws {Error} If the tool is not found or execution fails.
 */
async function dispatchToolCall(toolName, args) {
  validateNonEmptyString(toolName, 'toolName');
  validateObject(args, 'args');

  const tool = registeredTools.get(toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found.`);
  }

  log(`Dispatching call to tool '${toolName}' with args: ${JSON.stringify(args)}`, 'tool-registry');
  return tool.execute(args);
}

// Register tools here as they are implemented, passing the shared instances
registerTool(new ImageGenerationTool(intelligenceSystem, geminiService));
registerTool(new ImageEditingTool(intelligenceSystem, geminiService));
registerTool(new ChatTool(intelligenceSystem, geminiService));
registerTool(new AudioTranscriptionTool(intelligenceSystem, geminiService));
registerTool(new CodeExecutionTool(intelligenceSystem, geminiService));
registerTool(new VideoAnalysisTool(intelligenceSystem, geminiService));
registerTool(new ImageAnalysisTool(intelligenceSystem, geminiService));
registerTool(new FileUploadTool(intelligenceSystem, geminiService));

module.exports = {
  registerTool,
  getToolListMetadata,
  dispatchToolCall,
  intelligenceSystem, // Export for server.js to initialize
};
