#!/bin/bash
# Complete restoration script for Gemini MCP Server

echo "🚀 Starting complete restoration of Gemini MCP Server..."

# Define directories
BROKEN_DIR="/Users/rob/Claude/mcp-servers/gemini-mcp-server-BROKEN"
CURRENT_DIR="/Users/rob/Claude/mcp-servers/gemini-mcp-server"

# Change to current directory
cd "$CURRENT_DIR"

echo "📁 Current directory: $(pwd)"

# Step 1: Backup current state (just in case)
echo "💾 Creating backup of current state..."
cp -r . ../gemini-mcp-server-BACKUP-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Step 2: Remove old directories that will be replaced
echo "🧹 Cleaning old directories..."
rm -rf src data scripts

# Step 3: Copy all files from BROKEN, excluding .git and node_modules
echo "📋 Copying all files from BROKEN directory..."
rsync -av \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  "$BROKEN_DIR/" "$CURRENT_DIR/"

# Step 4: Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x *.sh 2>/dev/null || true
chmod +x *.js 2>/dev/null || true
chmod +x scripts/*.js 2>/dev/null || true

# Step 5: Show git status
echo ""
echo "📊 Git status after restoration:"
git status --short

echo ""
echo "✅ Restoration complete!"
echo ""
echo "📌 Next steps:"
echo "1. Review the changes: git diff"
echo "2. Stage all changes: git add -A"
echo "3. Commit with message: git commit -m 'feat: restore advanced Smart Tool Intelligence features, verbatim mode, and all enhancements'"
echo "4. Push to GitHub: git push origin main --force-with-lease"
echo ""
echo "⚠️  Note: Using --force-with-lease because we're replacing old code with advanced version"
