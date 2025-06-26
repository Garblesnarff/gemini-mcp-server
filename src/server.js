/**
 * Gemini MCP Server implementation
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const Config = require('./config');
const logger = require('./logger');

// Create a server instance
function createServer(options = {}) {
  // Initialize configuration
  const config = new Config(options.configOptions);
  config.loadFromEnv();
  
  // Ensure API key is available
  if (!config.apiKey) {
    throw new Error('Google Gemini API key is required. Set it in the configuration or GEMINI_API_KEY environment variable.');
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
    logger.info(`Created output directory: ${config.outputDir}`);
  }
  
  // Initialize Google AI client
  const genAI = new GoogleGenerativeAI(config.apiKey);
  logger.info(`Initialized Gemini API with key: ${config.apiKey.substring(0, 8)}...`);
  
  // Send JSON RPC response to stdout
  function sendResponse(response) {
    console.log(JSON.stringify(response));
  }
  
  // Handle MCP protocol messages
  async function handleRequest(message) {
    try {
      const request = JSON.parse(message);
      logger.debug(`Received request: ${JSON.stringify(request)}`);
      
      const { id, method, params } = request;
      
      if (method === 'initialize') {
        // Critical part - match exact format expected by Claude Desktop
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'gemini-image-mcp',
              version: '1.0.0'
            },
            capabilities: {
              experimental: {},
              tools: {
                listChanged: false
              }
            }
          }
        });
      } 
      else if (method === 'tools/list') {
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'generate_image',
                description: 'Generate an image using Google\'s Gemini 2.0 Flash Experimental model',
                inputSchema: {
                  type: 'object',
                  properties: {
                    prompt: {
                      type: 'string',
                      description: 'Text description of the desired image',
                    },
                    temperature: {
                      type: 'number',
                      description: 'Controls randomness: Lower values make output more focused, higher more creative',
                      default: config.modelOptions.temperature,
                    },
                    style: {
                      type: 'string',
                      description: 'Optional style modifier for the image generation',
                      enum: ['realistic', 'artistic', 'minimalistic', 'vibrant', 'photographic', 'abstract'],
                    }
                  },
                  required: ['prompt'],
                },
              },
            ],
          },
        });
      } 
      else if (method === 'tools/call') {
        const { name, arguments: args } = params;
        
        if (name === 'generate_image') {
          if (!args || !args.prompt || typeof args.prompt !== 'string' || args.prompt.trim() === '') {
            sendResponse({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32602, // Invalid params
                message: 'Missing or invalid "prompt" argument for generate_image tool. Prompt must be a non-empty string.'
              }
            });
            return;
          }
          
          try {
            logger.info(`Generating image: "${args.prompt}"`);
            
            // Set up model configuration with user parameters
            const modelConfig = {
              ...config.modelOptions,
              temperature: args.temperature || config.modelOptions.temperature,
            };
            
            // Use gemini-2.0-flash-exp model for image generation
            const model = genAI.getGenerativeModel({
              model: modelConfig.model,
              generationConfig: {
                temperature: modelConfig.temperature,
                topK: modelConfig.topK,
                topP: modelConfig.topP,
                maxOutputTokens: modelConfig.maxOutputTokens,
                responseModalities: ["Text", "Image"]
              }
            });
            
            // Generate content with image capabilities
            let promptText = `Create an image of ${args.prompt}. Make the image detailed and high quality.`;
            
            // Add style if provided
            if (args.style) {
              promptText += ` The style should be ${args.style}.`;
            }
            
            const result = await model.generateContent(promptText);
            
            logger.debug("Response received from Gemini API");
            
            let imageData = null;
            let responseText = '';
            
            // Extract image data from the response
            if (result.response?.candidates?.length > 0) {
              const candidate = result.response.candidates[0];
              if (candidate.content?.parts) {
                logger.debug("Processing content parts...");
                
                for (const part of candidate.content.parts) {
                  if (part.text) {
                    responseText += part.text;
                    logger.debug(`Text content: ${part.text.substring(0, 100)}${part.text.length > 100 ? '...' : ''}`);
                  }
                  
                  if (part.inlineData?.mimeType?.startsWith('image/')) {
                    logger.debug("Found image data in inlineData");
                    imageData = part.inlineData.data;
                  }
                  
                  if (part.fileData?.mimeType?.startsWith('image/')) {
                    logger.debug("Found image data in fileData");
                    imageData = part.fileData.data;
                  }
                }
              }
            }
            
            // If we found image data, save it and return it
            if (imageData) {
              logger.info("Successfully extracted image data");
              
              // Save image to file
              const timestamp = Date.now();
              const hash = crypto.createHash('md5').update(args.prompt).digest('hex');
              const imageName = `gemini-${hash}-${timestamp}.png`;
              const imagePath = path.join(config.outputDir, imageName);
              
              fs.writeFileSync(imagePath, Buffer.from(imageData, 'base64'));
              logger.info(`Image saved to: ${imagePath}`);
              
              sendResponse({
                jsonrpc: '2.0',
                id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `✓ Image successfully generated from prompt: "${args.prompt}"\n\nYou can find the image at: ${imagePath}`
                    }
                  ]
                }
              });
              
              logger.info(`Successfully generated image for prompt: "${args.prompt}"`);
            } else {
              logger.warn("No image data found in response");
              
              sendResponse({
                jsonrpc: '2.0',
                id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `Could not generate image for: "${args.prompt}". The Gemini API did not return image data.`
                    }
                  ]
                }
              });
            }
          } catch (error) {
            logger.error(`Error generating image: ${error.message}`);
            
            sendResponse({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32000,
                message: `Error generating image: ${error.message}`
              }
            });
          }
        } else {
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found or missing required parameters`
            }
          });
        }
      }
      else if (method === 'resources/list' || method === 'prompts/list') {
        // Respond to standard polling requests
        sendResponse({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
      }
      else if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
        // Just log these notifications
        logger.debug(`Received notification: ${method}`);
      }
      else {
        sendResponse({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
      }
    } catch (error) {
      logger.error(`Error processing request: ${error.message}`);
      logger.error(error.stack);
      
      try {
        const request = JSON.parse(message);
        if (request && request.id) {
          sendResponse({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: `Server error: ${error.message}`
            }
          });
        }
      } catch (parseError) {
        logger.error(`Failed to parse request after error: ${parseError.message}`);
      }
    }
  }
  
  // Start the server
  function start() {
    // Set up stdin reading for MCP protocol
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    rl.on('line', (line) => {
      if (line.trim()) {
        handleRequest(line);
      }
    });
    
    // Handle process signals
    process.on('SIGINT', () => {
      logger.info('Received SIGINT. Shutting down...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM. Shutting down...');
      process.exit(0);
    });
    
    // Log that we're ready
    logger.info('Gemini MCP server ready on stdin/stdout');
  }
  
  return {
    start,
    handleRequest, // Exposed for testing
    config,
  };
}

module.exports = { createServer };
