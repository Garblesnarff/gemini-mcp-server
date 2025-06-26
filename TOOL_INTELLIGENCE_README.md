# Gemini MCP Server - Smart Tool Intelligence

## What's New in v2.1

The Smart Tool Intelligence system is now **completely self-contained**! All preferences and learned patterns are stored internally within the server directory, making it fully portable and eliminating external dependencies.

### Key Changes:
- ✅ **Internal Storage**: Preferences are now stored in `./data/tool-preferences.json`
- ✅ **Automatic Migration**: Existing preferences from `~/Claude/tool-preferences.json` are automatically migrated
- ✅ **Self-Contained**: The entire server can be moved/copied as a complete unit
- ✅ **Backwards Compatible**: Existing users' preferences are preserved

## How It Works

The enhanced gemini-chat tool automatically detects your context and enhances prompts for better responses.

### Example Enhancements

#### 1. Consciousness Research (context: "aurora")
- **Your prompt**: "What is consciousness emergence?"
- **Enhanced prompt**: "What is consciousness emergence?

Be specific and cite sources. Provide academic rigor and detailed technical explanations."

#### 2. Code Requests (context: "code")  
- **Your prompt**: "How do I implement a singleton pattern?"
- **Enhanced prompt**: "How do I implement a singleton pattern?

Include practical examples and explain implementation details. Provide working code with best practices."

#### 3. Debugging (context: "debugging")
- **Your prompt**: "My MCP server won't load"
- **Enhanced prompt**: "My MCP server won't load

Explain the root cause and provide specific fixes. Include detailed explanations and prevention tips."

#### 4. General Queries (no context)
- **Your prompt**: "What's the weather today?"
- **Enhanced prompt**: "What's the weather today?

Provide a comprehensive, technically detailed response with clear structure."

## Management Tools

The server now includes management scripts for preferences:

```bash
# Inspect current preferences and learned patterns
npm run inspect

# Manually migrate external preferences (automatic on first run)
npm run migrate

# Clean/reset preferences (creates backup first)
npm run clean
```

## Testing

Run the test script to see Tool Intelligence in action:
```bash
cd /Users/rob/Claude/mcp-servers/gemini-mcp-server
npm test
```

## Usage in Claude

After restarting Claude Desktop:

```
Tool: gemini-chat
Message: "Explain consciousness emergence in AI systems"
Context: "aurora"
```

The Tool Intelligence will:
1. Detect the consciousness research context
2. Enhance the prompt with requirements for citations and academic rigor
3. Learn from the interaction for future improvements
4. Store successful patterns internally in `./data/tool-preferences.json`

## Data Storage

All preferences are now stored within the server directory:
- **Location**: `./data/tool-preferences.json`
- **Backup**: Old external preferences are preserved at `~/Claude/tool-preferences.json`
- **Portability**: The entire server directory is self-contained

The internal storage system supports:
- Automatic migration from external files
- Pattern learning and storage (up to 100 patterns per context)
- Export/import functionality for backups
- Clean separation from external dependencies
