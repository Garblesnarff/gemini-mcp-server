#!/bin/bash
# Script to restore advanced code from BROKEN backup

echo "Restoring advanced Gemini MCP Server code..."

# Copy all documentation files
echo "Copying documentation..."
cp /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/*.md /Users/rob/Claude/mcp-servers/gemini-mcp-server/ 2>/dev/null

# Copy configuration files
echo "Copying configuration files..."
cp /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/gemini*.json /Users/rob/Claude/mcp-servers/gemini-mcp-server/ 2>/dev/null
cp /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/*.js /Users/rob/Claude/mcp-servers/gemini-mcp-server/ 2>/dev/null
cp /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/*.sh /Users/rob/Claude/mcp-servers/gemini-mcp-server/ 2>/dev/null

# Copy directories
echo "Copying directories..."
# Remove old src contents first
rm -rf /Users/rob/Claude/mcp-servers/gemini-mcp-server/src/*
# Copy the advanced src structure
cp -r /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/src/* /Users/rob/Claude/mcp-servers/gemini-mcp-server/src/

# Copy data directory
mkdir -p /Users/rob/Claude/mcp-servers/gemini-mcp-server/data
cp -r /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/data/* /Users/rob/Claude/mcp-servers/gemini-mcp-server/data/ 2>/dev/null

# Copy scripts directory
mkdir -p /Users/rob/Claude/mcp-servers/gemini-mcp-server/scripts
cp -r /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/scripts/* /Users/rob/Claude/mcp-servers/gemini-mcp-server/scripts/ 2>/dev/null

# Copy .github directory if it exists
if [ -d "/Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/.github" ]; then
  cp -r /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/.github /Users/rob/Claude/mcp-servers/gemini-mcp-server/
fi

# Copy test audio file
cp /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/test-verbatim.mp3 /Users/rob/Claude/mcp-servers/gemini-mcp-server/ 2>/dev/null

# Update package.json
cp /Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN/package.json /Users/rob/Claude/mcp-servers/gemini-mcp-server/

echo "Advanced code restoration complete!"
echo "Files have been copied from BROKEN to current directory."
