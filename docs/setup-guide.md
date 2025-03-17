# Setup Guide for Gemini MCP Server

This guide provides step-by-step instructions for setting up the Gemini MCP Server for Claude Desktop, allowing you to generate images with Google's Gemini AI directly from Claude.

## Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) 16.x or higher installed
- [Claude Desktop](https://claude.ai/desktop) application installed and working
- A Google Generative AI API key ([Get one here](https://ai.google.dev/))
- Basic familiarity with the command line

## Installation Options

### Option 1: Using NPM (Recommended)

This method installs the package globally on your system:

```bash
# Install the package globally
npm install -g gemini-mcp-server

# Run the setup wizard
npx gemini-mcp-setup
```

### Option 2: Local Installation

If you prefer a local installation:

```bash
# Create a directory for the server
mkdir gemini-mcp
cd gemini-mcp

# Install locally
npm install gemini-mcp-server

# Run the setup wizard
npx gemini-mcp-setup
```

## Setup Wizard

The setup wizard will guide you through the configuration process with a series of prompts:

1. **Google Gemini API Key**
   - Enter your Google Gemini API key
   - If you don't have one, [create it in the Google AI Studio](https://ai.google.dev/)

2. **Output Directory**
   - Specify where generated images should be saved
   - Default is `~/Claude/gemini-images`

3. **Debug Logging**
   - Enable detailed logging for troubleshooting
   - Logs are saved to `~/Claude/logs/gemini-image-mcp.log`

4. **Model Selection**
   - Choose which Gemini model to use
   - Recommended: `gemini-2.0-flash-exp` for best image generation

5. **Temperature Setting**
   - Controls the creativity/randomness of the generation
   - Lower values (0.1-0.4) are more focused and deterministic
   - Higher values (0.7-1.0) are more creative and varied

6. **Wrapper Script Creation**
   - Creates a bash script that Claude Desktop will use to launch the server
   - Recommended to say "Yes"

7. **Claude Desktop Configuration**
   - Updates your Claude Desktop configuration to include the Gemini MCP server
   - If no configuration exists, creates an example configuration file

After the wizard completes:

1. Review the summary of installed components
2. Note any suggested next steps
3. Restart Claude Desktop to apply the changes

## Manual Setup

If you prefer to configure the server manually or the wizard doesn't work for your setup:

### 1. Create a Configuration File

Create a JSON file (e.g., `~/.config/gemini-mcp-config.json`):

```json
{
  "apiKey": "YOUR_GEMINI_API_KEY_HERE",
  "outputDir": "/Users/yourusername/Claude/gemini-images",
  "debug": true,
  "modelOptions": {
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.4,
    "topK": 32,
    "topP": 1,
    "maxOutputTokens": 8192
  }
}
```

### 2. Create the Wrapper Script

Create a file at `~/.config/claude/mcp-servers/gemini-mcp-wrapper.sh`:

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
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
export OUTPUT_DIR="$OUTPUT_DIR"
export DEBUG="true"

# Execute the server
exec "$(which node)" "$(npm root -g)/gemini-mcp-server/bin/gemini-mcp-server.js" --config ~/.config/gemini-mcp-config.json 2>> "$LOG_FILE"
```

Make it executable:

```bash
chmod +x ~/.config/claude/mcp-servers/gemini-mcp-wrapper.sh
```

### 3. Update Claude Desktop Configuration

Edit `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gemini-image": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "/Users/yourusername/.config/claude/mcp-servers/gemini-mcp-wrapper.sh"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
        "DEBUG": "true"
      }
    }
  }
}
```

If the file doesn't exist, create it with the content above.

## Verifying Installation

To verify the server is installed and configured correctly:

1. Restart Claude Desktop application
2. Check the status indicator in Claude Desktop for active MCP servers
3. Look for "gemini-image" in the list of available servers
4. Check the log file for successful startup messages:
   ```bash
   cat ~/Claude/logs/gemini-image-mcp.log
   ```
5. Ask Claude to generate a simple image:
   ```
   Generate an image of a sunset over the ocean
   ```

## Getting Your Google Gemini API Key

If you don't have a Google Gemini API key, follow these steps:

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Navigate to the API Keys section
4. Click "Create API Key"
5. Copy the generated key
6. Use this key during the setup process

Note that Google may require you to set up billing information, even though there is typically a free tier available.

## Setting Up With Multiple MCP Servers

If you already have other MCP servers configured for Claude Desktop, you'll need to add the Gemini MCP server to your existing configuration. Here's how:

1. Open your existing `claude_desktop_config.json` file:
   ```bash
   nano ~/.config/claude/claude_desktop_config.json
   ```

2. Add the Gemini MCP server configuration to the `mcpServers` object:
   ```json
   "gemini-image": {
     "command": "/bin/bash",
     "args": [
       "-c",
       "/Users/yourusername/.config/claude/mcp-servers/gemini-mcp-wrapper.sh"
     ],
     "env": {
       "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
       "DEBUG": "true"
     }
   }
   ```

3. Save the file and restart Claude Desktop

## Directory Structure

After setup, you should have the following directory structure:

```
~/.config/claude/mcp-servers/
└── gemini-mcp-wrapper.sh

~/Claude/
├── gemini-images/
│   └── (generated images will be stored here)
└── logs/
    └── gemini-image-mcp.log
```

## Upgrading

To upgrade to the latest version:

```bash
npm update -g gemini-mcp-server
```

After upgrading, it's a good idea to run the setup wizard again to ensure your configuration is up-to-date:

```bash
npx gemini-mcp-setup
```

## Uninstalling

If you need to uninstall the server:

```bash
# Remove the global package
npm uninstall -g gemini-mcp-server

# Remove the configuration from Claude Desktop (manual edit required)
nano ~/.config/claude/claude_desktop_config.json

# Remove the wrapper script
rm ~/.config/claude/mcp-servers/gemini-mcp-wrapper.sh

# Optionally, remove generated images and logs
rm -rf ~/Claude/gemini-images
rm ~/Claude/logs/gemini-image-mcp.log
```

## Next Steps

After successful installation, explore the following:

- Try generating different types of images with various prompts
- Experiment with different models and settings
- Check out the [Troubleshooting Guide](./troubleshooting.md) if you encounter issues
- Read the [API Documentation](./api.md) for advanced usage