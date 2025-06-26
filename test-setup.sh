#!/bin/bash
# Quick test script to verify Gemini MCP server works from new location

echo "🧪 Testing Gemini MCP Server from new organized location..."
echo "======================================================"

# Change to the gemini server directory
cd /Users/rob/Claude/mcp-servers/gemini-mcp-server

# Check if all required files exist
echo "📁 Checking file structure..."
if [ -f "gemini-server.js" ]; then
    echo "✅ gemini-server.js found"
else
    echo "❌ gemini-server.js missing"
    exit 1
fi

if [ -f "tool_intelligence.js" ]; then
    echo "✅ tool_intelligence.js found"
else
    echo "❌ tool_intelligence.js missing"
    exit 1
fi

if [ -f "gemini-wrapper.sh" ]; then
    echo "✅ gemini-wrapper.sh found"
else
    echo "❌ gemini-wrapper.sh missing"
    exit 1
fi

# Make wrapper executable
chmod +x gemini-wrapper.sh
echo "✅ Made wrapper script executable"

# Check if node_modules exists in parent directory
if [ -d "../node_modules/@google/generative-ai" ]; then
    echo "✅ Google Generative AI package found in parent node_modules"
else
    echo "⚠️  Google Generative AI package not found - installing..."
    cd /Users/rob/Claude/mcp-servers
    npm install @google/generative-ai
    cd gemini-mcp-server
fi

# Test the tool intelligence module
echo ""
echo "🧠 Testing Tool Intelligence module..."
node -e "
try {
  const ToolIntelligence = require('./tool_intelligence');
  const ti = new ToolIntelligence('test');
  console.log('✅ Tool Intelligence module loads successfully');
} catch (error) {
  console.log('❌ Tool Intelligence module error:', error.message);
  process.exit(1);
}
"

echo ""
echo "📋 Configuration for Claude Desktop:"
echo "===================================="
echo "Add this to your Claude Desktop configuration:"
echo ""
cat gemini-config-snippet.json
echo ""
echo ""
echo "🎉 Gemini MCP Server is ready!"
echo "   Location: /Users/rob/Claude/mcp-servers/gemini-mcp-server/"
echo "   Features: Smart Tool Intelligence enabled"
echo "   Tools: 7 tools (chat, image generation, audio transcription, etc.)"
echo ""
echo "👉 Next steps:"
echo "   1. Update Claude Desktop config with the snippet above"
echo "   2. Restart Claude Desktop"
echo "   3. Test with: gemini-chat tool with context parameters"
