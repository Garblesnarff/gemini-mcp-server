# Gemini MCP Server for Claude Desktop

A Model Context Protocol (MCP) server that enables Claude Desktop to generate images using Google's Gemini AI models.

## 🌟 Features

- Generate images directly from Claude Desktop using Google's Gemini models
- Easy setup wizard for configuration
- Customizable image generation parameters
- Integration with Claude Desktop's MCP server system
- Detailed logging and debugging capabilities
- Docker support for easy deployment and sharing

## 📋 Requirements

- Node.js 16.x or higher
- Claude Desktop application
- Google Gemini API key ([Get one here](https://ai.google.dev/))
- Docker (optional, for containerized deployment)

## 🚀 Installation

### Global Installation (Recommended)

```bash
npm install -g gemini-mcp-server

# Run the setup wizard
npx gemini-mcp-setup
```

### Local Installation

```bash
# Create a directory for the server
mkdir gemini-mcp-server
cd gemini-mcp-server

# Install locally
npm install gemini-mcp-server

# Run the setup wizard
npx gemini-mcp-setup
```

### Docker Installation

You can also run the Gemini MCP server using Docker:

```bash
# Build the Docker image
docker build -t gemini-mcp-server .

# Run the Docker container
docker run -e GEMINI_API_KEY="your-api-key" -e OUTPUT_DIR="/app/output" -v /path/on/host:/app/output gemini-mcp-server
```

## ⚙️ Setup

The setup wizard will guide you through the configuration process:

1. Enter your Google Gemini API key
2. Specify the directory for saving generated images
3. Configure logging and model settings
4. Automatically create a wrapper script for Claude Desktop
5. Update your Claude Desktop configuration

If you prefer manual setup, see the [Manual Configuration](#manual-configuration) section below.

## 🎨 Using the Gemini MCP Server

Once installed and configured, restart Claude Desktop to enable the Gemini MCP server. Then:

1. Start a conversation with Claude
2. Ask Claude to generate an image for you, for example:
   - "Generate an image of a mountain landscape at sunset"
   - "Create a picture of a futuristic city with flying cars"
   - "Make an illustration of a cat playing piano"

Claude will call the Gemini API to generate the image and provide you with the path to the saved image file.

### Advanced Options

You can customize the image generation with additional parameters:

- **Style**: Specify a style like "realistic", "artistic", "minimalistic", etc.
- **Temperature**: Control the creativity/randomness of the generation (0.0-1.0)

Example: "Generate an image of a cyberpunk city with neon lights in a realistic style with temperature 0.7"

## 🔧 Manual Configuration

If you prefer not to use the setup wizard, follow these steps:

### 1. Create Configuration File

Create a JSON configuration file with your settings:

```json
{
  "apiKey": "YOUR_GEMINI_API_KEY_HERE",
  "outputDir": "/path/to/your/output/directory",
  "debug": true,
  "modelOptions": {
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.4
  }
}
```

### 2. Create Wrapper Script

Create a bash script to run the server:

```bash
#!/bin/bash
# Set environment variables
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
export OUTPUT_DIR="/path/to/your/output/directory"
export DEBUG="true"

# Execute the server
exec "$(which node)" "$(npm root -g)/gemini-mcp-server/bin/gemini-mcp-server.js"
```

Make the script executable:

```bash
chmod +x gemini-mcp-wrapper.sh
```

### 3. Update Claude Desktop Configuration

Edit your `~/.config/claude/claude_desktop_config.json` file to add the Gemini MCP server:

```json
{
  "mcpServers": {
    "gemini-image": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "/path/to/your/gemini-mcp-wrapper.sh"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
        "DEBUG": "true"
      }
    }
  }
}
```

## 🐳 Docker Deployment

This MCP server includes a Dockerfile for easy deployment and sharing. The Docker image is configured to:

- Use Node.js 16 Alpine as a lightweight base
- Install all necessary dependencies
- Set up a default output directory at `/app/output`
- Allow configuration via environment variables

### Building the Docker Image

```bash
docker build -t gemini-mcp-server .
```

### Running with Docker

```bash
docker run \
  -e GEMINI_API_KEY="your-api-key" \
  -e OUTPUT_DIR="/app/output" \
  -e DEBUG="false" \
  -v /path/on/host:/app/output \
  gemini-mcp-server
```

### Environment Variables for Docker

When running the Docker container, you can configure the server using these environment variables:

- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `OUTPUT_DIR`: Directory to save generated images (default: `/app/output`)
- `DEBUG`: Enable debug logging (default: `false`)

### Using with Claude Desktop

When using the Docker container with Claude Desktop, you'll need to:

1. Ensure the container is running
2. Configure Claude Desktop to connect to the containerized server
3. Map the output directory to a location accessible by Claude

## 📚 API Documentation

### Command Line Interface

```
gemini-mcp-server [options]
```

Options:
- `-k, --api-key <key>`: Google Gemini API key
- `-o, --output-dir <dir>`: Directory to save generated images
- `-d, --debug`: Enable debug logging
- `-c, --config <path>`: Path to custom configuration file
- `-r, --reset-config`: Reset configuration to defaults
- `-v, --version`: Display version information

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key
- `OUTPUT_DIR`: Directory to save generated images
- `DEBUG`: Enable debug logging (`true` or `false`)
- `LOG_LEVEL`: Set log level (`ERROR`, `WARN`, `INFO`, or `DEBUG`)
- `GEMINI_LOG_FILE`: Custom log file path

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `apiKey` | Google Gemini API key | (required) |
| `outputDir` | Directory to save generated images | `~/Claude/gemini-images` |
| `debug` | Enable debug logging | `false` |
| `modelOptions.model` | Gemini model to use | `gemini-2.0-flash-exp` |
| `modelOptions.temperature` | Control creativity/randomness | `0.4` |
| `modelOptions.topK` | Top-k sampling parameter | `32` |
| `modelOptions.topP` | Top-p sampling parameter | `1` |
| `modelOptions.maxOutputTokens` | Maximum output tokens | `8192` |

## 🔍 Troubleshooting

### Common Issues

#### Server doesn't start or Claude can't connect to it

1. Check the log file at `~/Claude/logs/gemini-image-mcp.log`
2. Verify your API key is correct
3. Ensure all directories exist and have proper permissions
4. Restart Claude Desktop

#### Images aren't being generated

1. Verify your Google Gemini API key has the correct permissions
2. Check if the output directory exists and is writable
3. Examine the logs for specific error messages
4. Try a different prompt or model

#### Error: "Method not found"

This usually means Claude is trying to call a method that the MCP server doesn't support. Check the logs to see what method was requested.

#### Docker-specific issues

1. Ensure the container has proper network connectivity
2. Check if volume mounts are correctly configured
3. Verify environment variables are properly set
4. Review container logs with `docker logs [container-id]`

### Debug Mode

Enable debug mode for more detailed logs:

```bash
npx gemini-mcp-server --debug
```

Or set the environment variable:

```bash
export DEBUG=true
npx gemini-mcp-server
```

## 📝 License

MIT

## 🙏 Acknowledgements

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [Google Generative AI](https://ai.google.dev/) for the Gemini API
- All contributors to this project