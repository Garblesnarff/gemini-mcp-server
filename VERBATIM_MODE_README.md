# Verbatim Transcription Mode Fix

## Problem
The Gemini MCP server's audio transcription tool was providing summaries instead of word-for-word transcriptions because the Tool Intelligence enhancement was adding "Adopt a concise style. Ensure the response includes: key points." to every request.

## Solution
Implemented a special "verbatim" context mode that bypasses normal intelligence enhancements and instead adds specific instructions for exact word-for-word transcription.

## Changes Made

### 1. Updated `prompt-enhancer.js`
- Added special handling for `context="verbatim"`
- When verbatim context is detected, it returns a specific enhancement for word-for-word transcription
- Includes instructions to capture all utterances, pauses, filler words, and incomplete sentences

### 2. Updated `context-detector.js`
- Added verbatim context detection as highest priority
- When `context="verbatim"` is passed, it immediately returns 'verbatim' context

## Usage

To get a verbatim transcription, use the tool with `context="verbatim"`:

```javascript
// In Claude Desktop
await gemini_transcribe_audio({
  file_path: "/path/to/audio.mp3",
  context: "verbatim"
});
```

## Testing

Run the test script to verify the verbatim mode:

```bash
cd /Users/rob/Claude/mcp-servers/gemini-mcp-server
node test-verbatim-mode.js
```

## Expected Behavior

### Without verbatim context:
- Tool Intelligence adds style enhancements (e.g., "Adopt a technical depth style")
- May result in summarized transcriptions

### With verbatim context:
- Tool Intelligence adds: "Provide an exact word-for-word transcription including all utterances, pauses, filler words (um, uh, etc.), repetitions, and incomplete sentences. Do not summarize or clean up the text. Include everything exactly as spoken."
- Results in complete, unedited transcriptions

## Next Steps

After implementing this fix:
1. Restart the Gemini MCP server in Claude Desktop
2. Test with an audio file using `context="verbatim"`
3. Verify you get word-for-word transcriptions instead of summaries
