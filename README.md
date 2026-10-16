# Gemini MCP Server v3

A Model Context Protocol (MCP) server that gives Claude Desktop — and any MCP client — the full current Gemini stack: chat, **Nano Banana 2.1** image generation and conversational editing, **Veo 3.1** video generation, **Gemini 3.8 TTS**, transcription, analysis, code execution, search grounding, file uploads, and a **learning system that actually learns**.

This is a ground-up rebuild (v3.0.0) of the original 2025 server: new `@google/genai` SDK, current model IDs, the official MCP SDK with modern protocol features, and a real feedback-to-profile learning loop replacing v2's keyword-appendix system.

## Tools (15)

| Tool | What it does |
|---|---|
| `gemini-chat` | Multi-turn chat with session memory + your learned preferences |
| `gemini-generate-image` | Nano Banana 2.1 (`gemini-nano-banana-2.1`) — 1K/2K/4K, wide aspect ratios, thinking levels |
| `gemini-edit-image` | Conversational image editing, up to 14 reference images |
| `gemini-generate-image-pro` | Nano Banana Pro (`gemini-3-pro-image`) — max quality |
| `gemini-generate-video` | Start a Veo 3.1 video generation (text or image-to-video) |
| `gemini-poll-video` | Check the operation; downloads the MP4 when done |
| `gemini-text-to-speech` | Expressive TTS (`gemini-3.8-flash-tts`), 130+ languages, voice direction |
| `gemini-transcribe-audio` | Transcription with a true verbatim mode (ums, laughs, pauses) |
| `gemini-analyze-image` | Summary / objects / text / detailed image analysis |
| `gemini-analyze-video` | Summary / transcript / detailed video analysis |
| `gemini-code-execute` | Python in Gemini's sandboxed code-execution environment |
| `gemini-upload-file` | Gemini File API uploads (reusable URIs, 48h) |
| `gemini-search` | Google-Search-grounded answers with sources |
| `gemini-feedback` | Rate an interaction 1–5 — **this is what the server learns from** |
| `gemini-profile` | View / edit / distill / reset your learned profile |

Plus a `gemini://profile/current` resource exposing the learned profile as JSON.

## Quick start

```bash
git clone https://github.com/Garblesnarff/gemini-mcp-server.git
cd gemini-mcp-server
npm install
cp .env.example .env   # add your GEMINI_API_KEY from https://aistudio.google.com/apikey
npm start              # stdio mode
npm run start:http     # Streamable HTTP mode on :3100
```

### Claude Desktop config

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/path/to/gemini-mcp-server/bin/gemini-mcp.js"],
      "env": { "GEMINI_API_KEY": "your_key_here" }
    }
  }
}
```

## The learning system

v2's "Smart Tool Intelligence" matched keywords, appended canned sentences to prompts, and logged every interaction as `success: true` without ever reading the log back. v3 closes the loop:

1. **Every tool call is logged** — tool, intent, model, latency, outcome.
2. **You rate what mattered** with `gemini-feedback` (1–5 + optional note like "too verbose").
3. **After 10 new ratings**, Gemini itself distills your stable preferences into an explicit profile (`data/profile.json`).
4. **The profile becomes system instructions** on chat and analysis tools — behavior genuinely changes.
5. **It's inspectable**: `gemini-profile` (get/set/distill/reset) and the `gemini://profile/current` resource. No black box.

Intent detection is two-stage: a keyword fast path, then embedding similarity (`gemini-embedding-001`) when keywords miss.

## Configuration

All settings are environment variables (see `.env.example`). Key ones:

- `GEMINI_API_KEY` — required. Nothing else is secret; there are no hardcoded keys.
- `GEMINI_CHAT_MODEL` (default `gemini-3.7-flash`), `GEMINI_IMAGE_MODEL` (default `gemini-nano-banana-2.1`), `GEMINI_IMAGE_PRO_MODEL`, `GEMINI_VIDEO_MODEL`, `GEMINI_TTS_MODEL`, `GEMINI_EMBEDDING_MODEL`
- `OUTPUT_DIR`, `DATA_DIR`, `MCP_HTTP_PORT`, `DEBUG`

## Tests

```bash
npm test   # 30+ tests, all against a mock Gemini client — no API key needed
```

Live API verification (image gen, Veo, TTS against real models) requires a key and is documented in the test output.

## License

MIT
