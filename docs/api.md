# Gemini MCP Server API Documentation

This document provides detailed information about the Gemini MCP Server API, including programmatic usage, configuration options, and integration methods.

## Table of Contents

- [MCP Protocol Implementation](#mcp-protocol-implementation)
- [Configuration API](#configuration-api)
- [Command Line Interface](#command-line-interface)
- [Server API](#server-api)
- [Integration with Claude Desktop](#integration-with-claude-desktop)
- [Advanced Usage](#advanced-usage)

## MCP Protocol Implementation

The Gemini MCP Server implements the Model Context Protocol (MCP) version 2024-11-05. This protocol allows Claude Desktop to communicate with the server using a standardized JSON-RPC interface.

### Supported Methods

| Method | Description |
|--------|-------------|
| `initialize` | Initializes the server and returns capability information |
| `tools/list` | Returns the list of available tools (image generation) |
| `tools/call` | Executes a tool with the provided arguments |

### Example JSON-RPC Messages

**Initialize Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize"
}
```

**Initialize Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "gemini-image-mcp",
      "version": "1.0.0"
    },
    "capabilities": {
      "experimental": {},
      "tools": {
        "listChanged": false
      }
    }
  }
}
```

**Tools List Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Tools List Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "generate_image",
        "description": "Generate an image using Google's Gemini 2.0 Flash Experimental model",
        "inputSchema": {
          "type": "object",
          "properties": {
            "prompt": {
              "type": "string",
              "description": "Text description of the desired image"
            },
            "temperature": {
              "type": "number",
              "description": "Controls randomness: Lower values make output more focused, higher more creative",
              "default": 0.4
            },
            "style": {
              "type": "string",
              "description": "Optional style modifier for the image generation",
              "enum": ["realistic", "artistic", "minimalistic", "vibrant", "photographic", "abstract"]
            }
          },
          "required": ["prompt"]
        }
      }
    ]
  }
}
```

**Tool Call Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "generate_image",
    "arguments": {
      "prompt": "A mountain landscape at sunset",
      "temperature": 0.7,
      "style": "realistic"
    }
  }
}
```

**Tool Call Successful Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✓ Image successfully generated from prompt: \"A mountain landscape at sunset\"\n\nYou can find the image at: /Users/username/Claude/gemini-images/gemini-abcdef123456-1647890123456.png"
      }
    ]
  }
}
```

## Configuration API

The server uses a configuration module that provides both programmatic and file-based configuration.

### Configuration Class

```javascript
const { Config } = require('gemini-mcp-server');

// Create a new configuration instance
const config = new Config();

// Set API key
config.apiKey = 'YOUR_API_KEY';

// Set output directory
config.outputDir = '/path/to/output/directory';

// Enable debug logging
config.debug = true;

// Configure model options
config.modelOptions = {
  model: 'gemini-2.0-flash-exp',
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 8192
};

// Load from environment variables
config.loadFromEnv();

// Reset to defaults
config.reset();
```

### Configuration File Format

The configuration is stored in JSON format:

```json
{
  "apiKey": "YOUR_API_KEY",
  "outputDir": "/path/to/output/directory",
  "debug": true,
  "modelOptions": {
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.9,
    "maxOutputTokens": 8192
  },
  "logsDir": "/path/to/logs/directory"
}
```

## Command Line Interface

The server provides a command-line interface (CLI) for direct execution and configuration.

### Basic Usage

```bash
npx gemini-mcp-server [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-k, --api-key <key>` | Google Gemini API key | (from config) |
| `-o, --output-dir <dir>` | Directory to save generated images | `~/Claude/gemini-images` |
| `-d, --debug` | Enable debug logging | `false` |
| `-c, --config <path>` | Path to custom configuration file | N/A |
| `-r, --reset-config` | Reset configuration to defaults | N/A |
| `-v, --version` | Display version information | N/A |

### Examples

```bash
# Start with custom API key
npx gemini-mcp-server --api-key YOUR_API_KEY

# Use custom output directory
npx gemini-mcp-server --output-dir ~/Pictures/gemini

# Load custom configuration file
npx gemini-mcp-server --config ~/gemini-config.json

# Enable debug logging
npx gemini-mcp-server --debug

# Reset configuration and start
npx gemini-mcp-server --reset-config
```

## Server API

For programmatic use, the server provides a JavaScript API:

```javascript
const { createServer } = require('gemini-mcp-server');

// Create a server instance with custom options
const server = createServer({
  configOptions: {
    defaults: {
      apiKey: 'YOUR_API_KEY',
      outputDir: '/path/to/output/directory',
      debug: true
    }
  }
});

// Access the configuration
console.log(server.config.apiKey);

// Start the server
server.start();

// For testing, you can directly handle requests
server.handleRequest(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize'
}));
```

## Integration with Claude Desktop

The server integrates with Claude Desktop through the MCP protocol. This integration is configured in the `claude_desktop_config.json` file.

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "gemini-image": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "/path/to/gemini-mcp-wrapper.sh"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY",
        "DEBUG": "true"
      }
    }
  }
}
```

### Wrapper Script

The wrapper script is responsible for starting the server with the correct environment:

```bash
#!/bin/bash
# Wrapper script for Gemini Image MCP server

# Set up logging
LOG_DIR="$HOME/Claude/logs"
LOG_FILE="$LOG_DIR/gemini-image-mcp.log"
mkdir -p "$LOG_DIR"
echo "===================================================" >> "$LOG_FILE"
echo "Starting Gemini Image MCP server at $(date)" >> "$LOG_FILE"

# Ensure output directory exists
OUTPUT_DIR="$HOME/Claude/gemini-images"
mkdir -p "$OUTPUT_DIR"

# Set environment variables
export GEMINI_API_KEY="YOUR_API_KEY"
export OUTPUT_DIR="$OUTPUT_DIR"
export DEBUG="true"

# Execute the server
exec "$(which node)" "$(npm root -g)/gemini-mcp-server/bin/gemini-mcp-server.js" 2>> "$LOG_FILE"
```

## Advanced Usage

### Customizing the Gemini API Call

For advanced users, you can customize the Gemini API call by modifying the temperature, style, and other parameters:

```
Generate an image of a futuristic cityscape with temperature 0.8 and artistic style
```

Claude will interpret this and pass the appropriate parameters to the Gemini API.

### Environment Variables

The server recognizes the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | (required) |
| `OUTPUT_DIR` | Directory to save generated images | `~/Claude/gemini-images` |
| `DEBUG` | Enable debug logging | `false` |
| `LOG_LEVEL` | Set log level (`ERROR`, `WARN`, `INFO`, `DEBUG`) | `INFO` |
| `GEMINI_LOG_FILE` | Custom log file path | `~/Claude/logs/gemini-image-mcp.log` |

### Extended Model Options

The full set of model options that can be configured:

```javascript
modelOptions: {
  model: 'gemini-2.0-flash-exp', // Model ID
  temperature: 0.4,              // Controls randomness (0.0-1.0)
  topK: 32,                      // Limits vocabulary for each prediction step
  topP: 1,                       // Limits vocabulary dynamically by probability
  maxOutputTokens: 8192          // Maximum tokens to generate
}
```

### Programmatic Image Generation

For testing or advanced integration, you can programmatically generate images:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

async function generateImage(apiKey, prompt, outputPath) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.4,
      responseModalities: ["Text", "Image"]
    }
  });
  
  const result = await model.generateContent(`Create an image of ${prompt}. Make the image detailed and high quality.`);
  
  // Extract image data
  let imageData = null;
  
  if (result.response?.candidates?.length > 0) {
    const candidate = result.response.candidates[0];
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }
  }
  
  if (imageData) {
    fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
    return outputPath;
  }
  
  return null;
}

// Example usage
generateImage(
  'YOUR_API_KEY',
  'a mountain landscape at sunset',
  './generated-image.png'
).then(imagePath => {
  console.log(`Image generated at: ${imagePath}`);
}).catch(error => {
  console.error('Error generating image:', error);
});
```

### Custom MCP Server Extensions

Advanced users can extend the MCP server with additional functionality by modifying the source code. Here are some ideas:

- Add support for image editing or variations
- Implement image saving to cloud storage
- Add support for different image generation services
- Create a web UI for viewing and managing generated images
