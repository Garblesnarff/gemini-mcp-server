# Troubleshooting Guide for Gemini MCP Server

This guide helps you troubleshoot and resolve common issues with the Gemini MCP Server for Claude Desktop.

## Table of Contents
- [Diagnosing Issues](#diagnosing-issues)
- [Common Problems and Solutions](#common-problems-and-solutions)
- [Advanced Troubleshooting](#advanced-troubleshooting)
- [Getting Help](#getting-help)

## Diagnosing Issues

### Check the Logs

The most important step in troubleshooting is to check the server logs:

```bash
cat ~/Claude/logs/gemini-image-mcp.log
```

The log file contains detailed information about:
- Server startup and configuration
- Requests received from Claude
- API calls to Gemini
- Error messages and stack traces

You can increase log verbosity by enabling debug mode:

```bash
export DEBUG=true
```

### Verify MCP Server Status in Claude Desktop

1. Open Claude Desktop
2. Look for the MCP server status indicator in the interface
3. Check if "gemini-image" appears as an active server

### Test the Server Manually

You can test the server directly from the command line:

```bash
npx gemini-mcp-server
```

Then in another terminal, send a test JSON-RPC request:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | nc -U /tmp/gemini-mcp.sock
```

## Common Problems and Solutions

### 1. "Unable to initialize Gemini MCP server"

**Causes:**
- Missing or incorrect API key
- Node.js not found or incorrect version
- Server executable not found

**Solutions:**
- Verify your API key is correct
- Ensure Node.js v16+ is installed: `node --version`
- Check the server executable permissions: `chmod +x ~/.config/claude/mcp-servers/gemini-mcp-wrapper.sh`
- Reinstall using the setup wizard: `npx gemini-mcp-setup`

### 2. "Error generating image: 403 Forbidden"

**Causes:**
- Invalid API key
- API key doesn't have permission for image generation
- Rate limiting or quota exceeded

**Solutions:**
- Double-check your API key in the configuration
- Verify your API key has the correct permissions in the Google AI Studio
- Check your Gemini API usage quota
- Create a new API key and update your configuration

### 3. "No image data found in response"

**Causes:**
- Gemini API didn't generate image data
- Prompt might be against AI safety policies
- Model doesn't support the requested content

**Solutions:**
- Try a different prompt
- Make the prompt more detailed and specific
- Check that you're using a model that supports image generation (e.g., gemini-2.0-flash-exp)
- Try reducing the temperature parameter

### 4. "Server crashed unexpectedly"

**Causes:**
- Memory issues
- Uncaught exceptions
- System resource limitations

**Solutions:**
- Check the logs for specific error messages
- Update to the latest version of the package
- Ensure your system has sufficient resources
- Restart the server and Claude Desktop

### 5. "Cannot find module '@google/generative-ai'"

**Causes:**
- Dependencies not installed
- Installation path issues

**Solutions:**
- Install missing dependencies: `npm install @google/generative-ai`
- Reinstall the package: `npm reinstall -g gemini-mcp-server`
- Check Node.js module paths: `echo $NODE_PATH`

## Advanced Troubleshooting

### Debugging MCP Protocol Issues

The MCP protocol uses a specific JSON-RPC format. If Claude isn't communicating properly with the server:

1. Enable debug logging
2. Check request/response formats in the logs
3. Verify the server is properly implementing the MCP protocol version 2024-11-05
4. Make sure responses match the expected structure exactly

### Debug Claude Desktop Configuration

If Claude doesn't recognize the Gemini MCP server:

1. Verify your `claude_desktop_config.json` file:
   ```bash
   cat ~/.config/claude/claude_desktop_config.json
   ```

2. Check for syntax errors:
   ```bash
   jq . < ~/.config/claude/claude_desktop_config.json
   ```

3. Compare with the example configuration

### Test Output Directory Access

Ensure the output directory is accessible and writable:

```bash
mkdir -p ~/Claude/gemini-images
touch ~/Claude/gemini-images/test.txt
ls -la ~/Claude/gemini-images
```

### Reset the Configuration

If all else fails, reset your configuration:

```bash
npx gemini-mcp-server --reset-config
npx gemini-mcp-setup
```

### Check Process Status

See if the server process is running:

```bash
ps aux | grep gemini-mcp
```

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub repository issues](https://github.com/yourusername/gemini-mcp-server/issues) for similar problems
2. Gather the following information before asking for help:
   - Complete log file contents
   - Node.js version: `node --version`
   - Package version: `npm list -g gemini-mcp-server`
   - Operating system and version
   - Steps to reproduce the issue
   - Any error messages (exact text)

3. Open a new issue on GitHub with the above information
