#!/bin/bash
# Efficient restoration script using rsync

echo "🔧 Restoring advanced Gemini MCP Server code..."

# Define directories
BROKEN_DIR="/Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN"
CURRENT_DIR="/Users/rob/Claude/mcp-servers/gemini-mcp-server"

# Use rsync to copy everything except .git directory
rsync -av --exclude='.git' --exclude='node_modules' "$BROKEN_DIR/" "$CURRENT_DIR/"

echo "✅ Advanced code restoration complete!"
echo ""
echo "📌 Next steps:"
echo "1. Check the changes: cd $CURRENT_DIR && git status"
echo "2. Stage all changes: git add ."
echo "3. Commit: git commit -m 'feat: restore advanced Smart Tool Intelligence features'"
echo "4. Push to GitHub: git push origin main"
