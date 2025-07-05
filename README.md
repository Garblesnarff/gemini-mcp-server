# Gemini MCP Server with Smart Tool Intelligence

Welcome to the Gemini MCP Server, the **first MCP server with Smart Tool Intelligence** - a revolutionary self-learning system that adapts to your preferences and improves over time. This comprehensive platform provides 7 AI-powered tools with automatic prompt enhancement and context awareness.

<a href="https://glama.ai/mcp/servers/@Garblesnarff/gemini-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Garblesnarff/gemini-mcp-server/badge" alt="Gemini Server for Claude Desktop MCP server" />
</a>

## 🚀 Features Overview

### 🤖 7 AI-Powered Tools
- **Image Generation** - Create images from text prompts using Gemini 2.0 Flash
- **Image Editing** - Edit existing images with natural language instructions  
- **Chat** - Interactive conversations with context-aware responses
- **Audio Transcription** - Convert audio to text with optional verbatim mode
- **Code Execution** - Run Python code in a secure sandbox environment
- **Video Analysis** - Analyze video content for summaries, transcripts, and insights
- **Image Analysis** - Extract objects, text, and detailed descriptions from images

### 🧠 Smart Tool Intelligence System *(First in MCP Ecosystem)*
- **Self-Learning** - Automatically learns from successful interactions
- **Context Detection** - Recognizes consciousness research, coding, debugging contexts  
- **Pattern Recognition** - Identifies usage patterns and user preferences
- **Prompt Enhancement** - Refines prompts for better AI model performance
- **Persistent Memory** - Stores learned preferences across sessions
- **Automatic Migration** - Seamlessly upgrades preference storage

## 📦 Quick Start

### Installation

```bash
git clone https://github.com/Garblesnarff/gemini-mcp-server.git
cd gemini-mcp-server
npm install
```

### Configuration

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   OUTPUT_DIR=/path/to/your/output/directory  # Optional
   DEBUG=false  # Optional
   ```

### Running the Server

```bash
npm start
# or for development with debug logging:
npm run dev
```

### Integration with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  \"mcpServers\": {
    \"gemini\": {
      \"command\": \"node\",
      \"args\": [\"/path/to/gemini-mcp-server/gemini-server.js\"],
      \"env\": {
        \"GEMINI_API_KEY\": \"your_api_key_here\"
      }
    }
  }
}
```

## 🛠️ Tool Reference

### 1. Image Generation (`generate_image`)

Generate images from text descriptions using Gemini 2.0 Flash.

**Parameters:**
- `prompt` (string, required) - Description of the image to generate
- `context` (string, optional) - Context for Smart Tool Intelligence enhancement

**Example:**
```javascript
{
  \"prompt\": \"A serene mountain landscape at sunset with vibrant colors\",
  \"context\": \"artistic\"
}
```

**Returns:**
```javascript
{
  \"content\": [{
    \"type\": \"text\",
    \"text\": \"Generated a beautiful mountain landscape image.\"
  }, {
    \"type\": \"image\", 
    \"data\": \"base64_image_data\",
    \"mimeType\": \"image/png\"
  }]
}
```

### 2. Image Editing (`gemini-edit-image`)

Edit existing images using natural language instructions.

**Parameters:**
- `image_path` (string, required) - Path to the image file to edit
- `edit_instruction` (string, required) - Description of desired changes
- `context` (string, optional) - Context for enhancement

**Example:**
```javascript
{
  \"image_path\": \"/path/to/image.jpg\",
  \"edit_instruction\": \"Add shooting stars to the night sky\",
  \"context\": \"artistic\"
}
```

### 3. Chat (`gemini-chat`)

Interactive conversations with Gemini AI that learns your preferences.

**Parameters:**
- `message` (string, required) - Your message or question
- `context` (string, optional) - Context for Smart Tool Intelligence

**Example:**
```javascript
{
  \"message\": \"Explain quantum computing in simple terms\",
  \"context\": \"consciousness\"  // Will apply academic rigor enhancement
}
```

### 4. Audio Transcription (`gemini-transcribe-audio`)

Convert audio files to text with Smart Tool Intelligence enhancement.

**Parameters:**
- `file_path` (string, required) - Path to audio file (MP3, WAV, FLAC, AAC, OGG, WEBM, M4A)
- `language` (string, optional) - Language hint for better accuracy
- `context` (string, optional) - Use \"verbatim\" for exact word-for-word transcription
- `preserve_spelled_acronyms` (boolean, optional) - Keep U-R-L instead of URL

**Example (Standard):**
```javascript
{
  \"file_path\": \"/path/to/audio.mp3\",
  \"language\": \"en\"
}
```

**Example (Verbatim Mode):**
```javascript
{
  \"file_path\": \"/path/to/audio.mp3\",
  \"context\": \"verbatim\",  // Gets exact word-for-word transcription
  \"preserve_spelled_acronyms\": true
}
```

**Verbatim Mode Features:**
- Captures all \"um\", \"uh\", \"like\", repeated words
- Preserves emotional expressions: [laughs], [sighs], [clears throat]
- Maintains original punctuation and sentence structure
- No summarization or cleanup

### 5. Code Execution (`gemini-code-execute`)

Execute Python code in a secure sandbox environment.

**Parameters:**
- `code` (string, required) - Python code to execute
- `context` (string, optional) - Context for enhancement

**Example:**
```javascript
{
  \"code\": \"import pandas as pd\\ndata = {'x': [1,2,3], 'y': [4,5,6]}\\ndf = pd.DataFrame(data)\\nprint(df.describe())\",
  \"context\": \"code\"
}
```

### 6. Video Analysis (`gemini-analyze-video`)

Analyze video content for summaries, transcripts, and detailed insights.

**Parameters:**
- `file_path` (string, required) - Path to video file (MP4, MOV, AVI, WEBM, MKV, FLV)
- `analysis_type` (string, optional) - \"summary\", \"transcript\", \"objects\", \"detailed\", \"custom\"
- `context` (string, optional) - Context for enhancement

**Example:**
```javascript
{
  \"file_path\": \"/path/to/video.mp4\",
  \"analysis_type\": \"detailed\"
}
```

### 7. Image Analysis (`gemini-analyze-image`)

Extract detailed information from images including objects, text, and descriptions.

**Parameters:**
- `file_path` (string, required) - Path to image file (JPEG, PNG, WebP, HEIC, HEIF, BMP, GIF)
- `analysis_type` (string, optional) - \"summary\", \"objects\", \"text\", \"detailed\", \"custom\"
- `context` (string, optional) - Context for enhancement

**Example:**
```javascript
{
  \"file_path\": \"/path/to/image.jpg\",
  \"analysis_type\": \"objects\"
}
```

## 🧠 Smart Tool Intelligence System

### How It Works

The Smart Tool Intelligence system is the first of its kind in the MCP ecosystem. It automatically:

1. **Detects Context** - Recognizes if you're doing consciousness research, coding, debugging, etc.
2. **Enhances Prompts** - Adds relevant instructions based on learned patterns
3. **Learns Patterns** - Stores successful interaction patterns for future use
4. **Adapts Over Time** - Gets better at helping you with each interaction

### Context Types

The system recognizes these contexts and applies appropriate enhancements:

- **`consciousness`** - Adds academic rigor, citations, detailed explanations
- **`code`** - Includes practical examples, working code, best practices  
- **`debugging`** - Focuses on root cause analysis and specific fixes
- **`general`** - Applies comprehensive, structured responses
- **`verbatim`** - For audio transcription, provides exact word-for-word output

### Storage Location

Preferences are stored internally at `./data/tool-preferences.json` with automatic migration from external storage.

### Implementing Smart Tool Intelligence in Your MCP Server

Want to add this revolutionary capability to your own MCP server? Here's how:

#### 1. Core Architecture

```javascript
// src/intelligence/context-detector.js
class ContextDetector {
  detectContext(prompt, toolName) {
    // Implement pattern matching for different contexts
    if (this.isConsciousnessContext(prompt)) return 'consciousness';
    if (this.isCodeContext(prompt)) return 'code';
    if (this.isDebuggingContext(prompt)) return 'debugging';
    return 'general';
  }
}

// src/intelligence/prompt-enhancer.js  
class PromptEnhancer {
  enhancePrompt(originalPrompt, context, toolName) {
    // Apply context-specific enhancements
    const enhancement = this.getEnhancementForContext(context);
    return `${originalPrompt}\\n\\n${enhancement}`;
  }
}

// src/intelligence/preference-store.js
class PreferencesManager {
  async storePattern(original, enhanced, context, toolName, success) {
    // Store successful patterns for future learning
  }
  
  async getPatterns(context) {
    // Retrieve learned patterns for context
  }
}
```

#### 2. Integration Pattern

```javascript
// In your tool's execute method:
async execute(args) {
  const intelligence = IntelligenceSystem.getInstance();
  
  // Detect context and enhance prompt
  const context = args.context || intelligence.contextDetector.detectContext(args.prompt, this.name);
  const enhancedPrompt = await intelligence.enhancePrompt(args.prompt, context, this.name);
  
  // Execute with enhanced prompt
  const result = await this.geminiService.generateContent(enhancedPrompt);
  
  // Store successful pattern
  await intelligence.storeSuccessfulPattern(args.prompt, enhancedPrompt, context, this.name);
  
  return result;
}
```

#### 3. Key Implementation Files

Study these files from this repository:
- `src/intelligence/index.js` - Main intelligence coordinator
- `src/intelligence/context-detector.js` - Context recognition logic
- `src/intelligence/prompt-enhancer.js` - Enhancement application
- `src/intelligence/preference-store.js` - Pattern storage and retrieval
- `src/tools/base-tool.js` - Integration with tool execution

## 🧪 Testing

### Run Test Suite

```bash
# Test basic functionality
npm test

# Test Smart Tool Intelligence
node test-tool-intelligence-full.js

# Test internal storage
node test-internal-storage.js

# Test verbatim transcription
node test-verbatim-mode.js
```

### Manual Testing Examples

```bash
# Test image generation
echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"generate_image\",\"arguments\":{\"prompt\":\"A cute robot reading a book\"}}}' | node gemini-server.js

# Test chat with consciousness context
echo '{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"gemini-chat\",\"arguments\":{\"message\":\"What is consciousness?\",\"context\":\"consciousness\"}}}' | node gemini-server.js
```

## 📊 Performance & Limits

### File Size Limits
- **Images**: 20MB (JPEG, PNG, WebP, HEIC, HEIF, BMP, GIF)
- **Audio**: 20MB (MP3, WAV, FLAC, AAC, OGG, WEBM, M4A)  
- **Video**: 100MB (MP4, MOV, AVI, WEBM, MKV, FLV)

### API Rate Limits
- Follows Google Gemini API rate limits
- Built-in error handling and retry logic
- Graceful degradation on quota exceeded

## 🏗️ Architecture Deep Dive

### Modular Design

```
src/
├── server.js              # MCP protocol handler
├── config.js              # Configuration management
├── tools/                 # Tool implementations
│   ├── index.js           # Tool registry & dispatcher
│   ├── base-tool.js       # Abstract base class
│   ├── chat.js            # Chat tool
│   ├── image-generation.js # Image generation tool
│   ├── image-editing.js   # Image editing tool
│   ├── audio-transcription.js # Audio transcription tool
│   ├── code-execution.js  # Code execution tool
│   ├── video-analysis.js  # Video analysis tool
│   └── image-analysis.js  # Image analysis tool
├── intelligence/          # Smart Tool Intelligence
│   ├── index.js           # Intelligence coordinator
│   ├── context-detector.js # Context recognition
│   ├── prompt-enhancer.js # Prompt enhancement
│   └── preference-store.js # Pattern storage
├── gemini/               # Gemini API integration
│   ├── gemini-service.js # API service layer
│   └── request-handler.js # Request formatting
└── utils/                # Utilities
    ├── logger.js         # Logging system
    └── file-utils.js     # File operations
```

### Intelligence System Flow

1. **Request Received** → Tool's execute method called
2. **Context Detection** → Analyze prompt for context clues
3. **Pattern Retrieval** → Get relevant learned patterns  
4. **Prompt Enhancement** → Apply context-specific improvements
5. **API Execution** → Send enhanced prompt to Gemini
6. **Pattern Storage** → Store successful interaction pattern
7. **Response Return** → Return enhanced result to user

## 🔧 Customization

### Adding New Contexts

```javascript
// In src/intelligence/context-detector.js
isMyCustomContext(prompt) {
  const patterns = [
    /custom pattern 1/i,
    /custom pattern 2/i
  ];
  return patterns.some(pattern => pattern.test(prompt));
}

// In src/intelligence/prompt-enhancer.js
getEnhancementForContext(context) {
  const enhancements = {
    'my_custom_context': 'Apply my custom enhancement instructions here.',
    // ... other contexts
  };
  return enhancements[context] || enhancements.general;
}
```

### Adding New Tools

1. Create tool file in `src/tools/my-new-tool.js`
2. Extend `BaseTool` class
3. Implement `execute` method with intelligence integration
4. Register in `src/tools/index.js`

```javascript
// src/tools/my-new-tool.js
class MyNewTool extends BaseTool {
  constructor(geminiService, intelligenceSystem) {
    super('my-new-tool', 'Description of my tool', geminiService, intelligenceSystem);
  }
  
  async execute(args) {
    // Use intelligence system for enhancement
    const context = args.context || this.detectContext(args.input);
    const enhancedPrompt = await this.enhancePrompt(args.input, context);
    
    // Your tool logic here
    const result = await this.geminiService.someMethod(enhancedPrompt);
    
    // Store successful pattern  
    await this.storeSuccessfulPattern(args.input, enhancedPrompt, context);
    
    return result;
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**\"Missing GEMINI_API_KEY\" Error**
```bash
# Ensure .env file exists and contains your API key
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here
```

**\"File not found\" Errors**
```bash
# Ensure file paths are absolute and files exist
# Check file permissions and formats
```

**Intelligence System Not Learning**
```bash
# Check data directory permissions
ls -la data/
# Verify tool-preferences.json is writable
```

### Debug Mode

```bash
DEBUG=true npm start
# or
npm run dev
```

### Logs Location

- Application logs: Console output
- Intelligence patterns: `./data/tool-preferences.json`
- Generated images: `$OUTPUT_DIR` (default: `~/Claude/gemini-images`)

## 🤝 Contributing

We welcome contributions! This project represents a new paradigm in MCP server development.

### Development Setup

```bash
git clone https://github.com/Garblesnarff/gemini-mcp-server.git
cd gemini-mcp-server
npm install
npm run dev
```

### Areas for Contribution

- **New Contexts** - Add support for specialized domains
- **Enhanced Patterns** - Improve learning algorithms
- **New Tools** - Expand Gemini AI capabilities
- **Performance** - Optimize intelligence system performance
- **Documentation** - Improve guides and examples

## 📈 Roadmap

- [ ] **Multi-language Support** - Context detection in multiple languages
- [ ] **Advanced Analytics** - Usage patterns and performance metrics  
- [ ] **Tool Chaining** - Intelligent coordination between multiple tools
- [ ] **Custom Models** - Support for fine-tuned Gemini models
- [ ] **Collaborative Learning** - Share anonymized patterns across instances
- [ ] **Visual Interface** - Web-based configuration and monitoring

## 🌟 Why This Matters

This is the **first MCP server that truly learns and adapts**. Traditional MCP servers are static - they do the same thing every time. Our Smart Tool Intelligence system represents a paradigm shift toward AI tools that become more helpful over time.

**For Users**: Better results with less effort as the system learns your preferences.  
**For Developers**: A blueprint for building truly intelligent, adaptive AI tools.  
**For the MCP Ecosystem**: A new standard for what MCP servers can become.

## 📄 License

This project is licensed under the [MIT License](LICENSE) - feel free to use, modify, and distribute.

## 🙏 Acknowledgments

Built with:
- **Google Gemini AI** - Powering the core AI capabilities
- **Model Context Protocol** - Enabling seamless integration  
- **Node.js & NPM** - Runtime and package management
- **Claude & Rob** - Human-AI collaboration at its finest

---

**Ready to experience the future of MCP servers?** [Get started now](#quick-start) and watch your AI tools become smarter with every interaction! 🚀