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
# Replace with the actual path to the npm global bin directory and the gemini-mcp-server.js file
exec "$(which node)" "$(npm root -g)/gemini-mcp-server/bin/gemini-mcp-server.js" 2>> "$LOG_FILE"
