#!/bin/bash
# Wrapper script for Gemini MCP server (Image generation + Chat + Audio transcription + Video analysis + Code execution)

# Set up logging
LOG_FILE=~/Claude/logs/gemini.log
mkdir -p ~/Claude/logs
echo "===================================================" >> $LOG_FILE
echo "Starting Gemini MCP server at $(date)" >> $LOG_FILE

# Ensure output directory exists
mkdir -p ~/Claude/gemini-images

# Set environment variables
export GEMINI_API_KEY=${GEMINI_API_KEY:-"AIzaSyD6Ki3ZtL19-Km9y8EQcywZvHJLDiRDyNk"}
export OUTPUT_DIR=~/Claude/gemini-images
export DEBUG=${DEBUG:-"true"}

# Install dependencies if needed
cd ~/Claude/mcp-servers/gemini-mcp-server
if [ ! -d "../node_modules/@google/generative-ai" ]; then
    echo "Installing required npm packages..." >> $LOG_FILE
    cd ~/Claude/mcp-servers
    npm install @google/generative-ai >> $LOG_FILE 2>> $LOG_FILE
    cd ~/Claude/mcp-servers/gemini-mcp-server
fi

# Make script executable
chmod +x ~/Claude/mcp-servers/gemini-mcp-server/gemini-server.js

# Execute the server directly
echo "Starting Gemini MCP server with Tool Intelligence..." >> $LOG_FILE
exec node ~/Claude/mcp-servers/gemini-mcp-server/gemini-server.js 2>> $LOG_FILE
