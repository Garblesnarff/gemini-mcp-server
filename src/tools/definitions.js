/**
 * Tool definitions for the Gemini MCP Server v3.
 *
 * Each tool is a plain object: { name, title, description, inputSchema,
 * outputSchema?, annotations, run }. server.js registers them with the MCP SDK.
 *
 * Every tool call flows through the learning system: intent detection,
 * interaction logging, and (for chat/text) the distilled profile.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ---------- helpers ----------

export const MIME_BY_EXT = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif',
  '.bmp': 'image/bmp', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska', '.flv': 'video/x-flv',
};

export function readFileChecked(filePath, { maxMb, kinds }) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${filePath}`);
  const stat = fs.statSync(abs);
  if (stat.size > maxMb * 1024 * 1024) {
    throw new Error(`File is ${(stat.size / 1048576).toFixed(1)}MB; limit is ${maxMb}MB. Upload it with gemini-upload-file first for larger files.`);
  }
  const ext = path.extname(abs).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) throw new Error(`Unsupported file type: ${ext}`);
  if (kinds && !kinds.some((k) => mimeType.startsWith(k))) {
    throw new Error(`Expected ${kinds.join('/')} file, got ${mimeType}`);
  }
  return { abs, mimeType, data: fs.readFileSync(abs).toString('base64'), size: stat.size };
}

export function saveOutput(ctx, buffer, ext) {
  fs.mkdirSync(ctx.outputDir, { recursive: true });
  const name = `gemini-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const full = path.join(ctx.outputDir, name);
  fs.writeFileSync(full, buffer);
  return full;
}

function textResult(text, extra = {}) {
  return { content: [{ type: 'text', text }], ...extra };
}

function errResult(message) {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

/** Wrap a handler with intent detection + interaction logging. */
async function withLearning(ctx, toolName, promptForIntent, modelUsed, fn) {
  const t0 = Date.now();
  const detected = await ctx.learning.detectIntent(promptForIntent);
  try {
    const result = await fn(detected);
    const id = ctx.learning.logInteraction({
      tool: toolName, intent: detected.intent, prompt: promptForIntent,
      modelUsed, ms: Date.now() - t0, ok: true,
    });
    return { ...result, _meta: { interactionId: id, intent: detected.intent } };
  } catch (err) {
    ctx.learning.logInteraction({
      tool: toolName, intent: detected.intent, prompt: promptForIntent,
      modelUsed, ms: Date.now() - t0, ok: false, error: err.message,
    });
    return errResult(err.message);
  }
}

import { defineToolsPart2 } from './definitions2.js';

const VERBATIM_PROMPT = `Provide an exact word-for-word transcription including all utterances, pauses, filler words (um, uh, etc.), repetitions, and incomplete sentences. Preserve emotional expressions in brackets like [laughs] or [sighs]. Maintain original punctuation including ellipses (...) and dashes. Do not add any artifacts or sounds at the end of the transcription. Do not summarize or clean up the text. Include everything exactly as spoken.`;

// ---------- tool definitions ----------

export function defineTools(ctx) {
  const { gemini, learning, config } = ctx;
  const M = config.models;

  const tools = [
    // ===== 1. CHAT (multi-turn, profile-aware) =====
    {
      name: 'gemini-chat',
      title: 'Chat with Gemini',
      description: 'Have a conversation with Gemini. Keeps session memory across calls and applies your learned preferences.',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Your message.' },
          session_id: { type: 'string', description: 'Existing session to continue. Omit to start fresh (a new id is returned).' },
          new_session: { type: 'boolean', description: 'Force a brand-new session, ignoring session_id.' },
          context: { type: 'string', description: 'Optional intent hint, e.g. "code", "debug", "writing", "research".' },
        },
        required: ['message'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          session_id: { type: 'string' },
          intent: { type: 'string' },
        },
        required: ['reply', 'session_id'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-chat', args.message, M.chat, async (detected) => {
          let sessionId = args.session_id;
          if (args.new_session || !sessionId || !learning.getSession(sessionId)) {
            sessionId = learning.newSession();
          }
          const systemPrompt = learning.getSystemPrompt();
          const contents = learning.sessionContents(sessionId, args.message);
          const reply = await gemini.generateText({
            model: M.chat,
            contents,
            systemInstruction: systemPrompt ?? undefined,
            config: { temperature: 0.7, maxOutputTokens: 4096 },
          });
          learning.appendTurn(sessionId, { role: 'user', text: args.message });
          learning.appendTurn(sessionId, { role: 'assistant', text: reply });
          return {
            content: [{ type: 'text', text: reply }],
            structuredContent: { reply, session_id: sessionId, intent: detected.intent },
          };
        });
      },
    },

    // ===== 2. IMAGE GENERATION (Nano Banana 2.1) =====
    {
      name: 'gemini-generate-image',
      title: 'Generate image (Nano Banana 2.1)',
      description: "Generate an image from a text prompt using Nano Banana 2.1 (gemini-nano-banana-2.1). Supports 1K/2K/4K and wide aspect ratios.",
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Text description of the image.' },
          aspect_ratio: { type: 'string', description: 'e.g. 1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 1:4, 4:1.', default: '1:1' },
          resolution: { type: 'string', enum: ['1K', '2K', '4K'], description: 'Output resolution.', default: '1K' },
          thinking_level: { type: 'string', enum: ['minimal', 'medium', 'high'], description: 'Quality/latency tradeoff.', default: 'medium' },
          style: { type: 'string', description: 'Optional style guidance, e.g. "photorealistic", "painterly".' },
        },
        required: ['prompt'],
      },
      outputSchema: {
        type: 'object',
        properties: { path: { type: 'string' }, prompt: { type: 'string' } },
        required: ['path'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        const fullPrompt = args.style ? `${args.prompt}\n\nStyle: ${args.style}` : args.prompt;
        return withLearning(ctx, 'gemini-generate-image', args.prompt, M.image, async () => {
          const img = await generateImageWithFallback();
          async function generateImageWithFallback() {
            const base = {
              model: M.image, prompt: fullPrompt,
              config: {
                imageConfig: { aspectRatio: args.aspect_ratio ?? '1:1', imageSize: args.resolution ?? '1K' },
              },
            };
            // NB 2.1 supports controllable thinking levels; fall back gracefully if rejected.
            if (args.thinking_level && args.thinking_level !== 'medium') {
              try {
                return await gemini.generateImage({ ...base, config: { ...base.config, thinkingConfig: { thinkingLevel: args.thinking_level.toUpperCase() } } });
              } catch (e) {
                if (!/thinking|invalid argument/i.test(e.message)) throw e;
              }
            }
            return gemini.generateImage(base);
          }
          if (!img.inline) return errResult(`No image was returned. Model said: ${(img.text || '').slice(0, 300)}`);
          const saved = saveOutput(ctx, Buffer.from(img.inline.data, 'base64'), 'png');
          return {
            content: [
              { type: 'image', data: img.inline.data, mimeType: img.inline.mimeType },
              { type: 'text', text: `Image saved to ${saved}` },
            ],
            structuredContent: { path: saved, prompt: args.prompt },
          };
        });
      },
    },

    // ===== 3. IMAGE EDITING (Nano Banana 2.1 conversational editing) =====
    {
      name: 'gemini-edit-image',
      title: 'Edit image (Nano Banana 2.1)',
      description: 'Edit an image with natural-language instructions. Supports up to 14 reference images for character/object consistency.',
      inputSchema: {
        type: 'object',
        properties: {
          image_path: { type: 'string', description: 'Path to the image to edit.' },
          edit_instruction: { type: 'string', description: 'What to change.' },
          reference_image_paths: { type: 'array', items: { type: 'string' }, description: 'Extra reference images (up to 13 more).' },
          aspect_ratio: { type: 'string', default: '1:1' },
          resolution: { type: 'string', enum: ['1K', '2K', '4K'], default: '1K' },
        },
        required: ['image_path', 'edit_instruction'],
      },
      outputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-edit-image', args.edit_instruction, M.image, async () => {
          const main = readFileChecked(args.image_path, { maxMb: config.limits.maxImageMb, kinds: ['image/'] });
          const images = [{ mimeType: main.mimeType, data: main.data }];
          for (const p of (args.reference_image_paths ?? []).slice(0, 13)) {
            const r = readFileChecked(p, { maxMb: config.limits.maxImageMb, kinds: ['image/'] });
            images.push({ mimeType: r.mimeType, data: r.data });
          }
          const img = await gemini.generateImage({
            model: M.image,
            prompt: args.edit_instruction,
            images,
            config: { imageConfig: { aspectRatio: args.aspect_ratio ?? '1:1', imageSize: args.resolution ?? '1K' } },
          });
          if (!img.inline) return errResult(`No image was returned. Model said: ${(img.text || '').slice(0, 300)}`);
          const saved = saveOutput(ctx, Buffer.from(img.inline.data, 'base64'), 'png');
          return {
            content: [
              { type: 'image', data: img.inline.data, mimeType: img.inline.mimeType },
              { type: 'text', text: `Edited image saved to ${saved}` },
            ],
            structuredContent: { path: saved },
          };
        });
      },
    },

    // ===== 4. PRO IMAGE (Nano Banana Pro) =====
    {
      name: 'gemini-generate-image-pro',
      title: 'Generate image — pro quality (Nano Banana Pro)',
      description: 'Highest-quality image generation via gemini-3-pro-image. Slower and pricier than the standard tool; use for hero art.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Text description of the image.' },
          aspect_ratio: { type: 'string', default: '1:1' },
          resolution: { type: 'string', enum: ['1K', '2K', '4K'], default: '2K' },
        },
        required: ['prompt'],
      },
      outputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-generate-image-pro', args.prompt, M.imagePro, async () => {
          const img = await gemini.generateImage({
            model: M.imagePro,
            prompt: args.prompt,
            config: { imageConfig: { aspectRatio: args.aspect_ratio ?? '1:1', imageSize: args.resolution ?? '2K' } },
          });
          if (!img.inline) return errResult(`No image was returned. Model said: ${(img.text || '').slice(0, 300)}`);
          const saved = saveOutput(ctx, Buffer.from(img.inline.data, 'base64'), 'png');
          return {
            content: [
              { type: 'image', data: img.inline.data, mimeType: img.inline.mimeType },
              { type: 'text', text: `Pro image saved to ${saved}` },
            ],
            structuredContent: { path: saved },
          };
        });
      },
    },

    // ===== 5. VIDEO GENERATION (Veo 3.1) — start =====
    {
      name: 'gemini-generate-video',
      title: 'Generate video (Veo 3.1)',
      description: 'Start a Veo 3.1 video generation. Returns an operation id immediately; poll with gemini-poll-video. Video gen is slow (minutes) and billed.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Text description of the video.' },
          image_path: { type: 'string', description: 'Optional still image to animate (image-to-video).' },
          aspect_ratio: { type: 'string', enum: ['16:9', '9:16'], default: '16:9' },
          duration_seconds: { type: 'integer', enum: [4, 6, 8], default: 8 },
          fast: { type: 'boolean', description: 'Use the faster/cheaper Veo 3.1 Fast model.', default: false },
        },
        required: ['prompt'],
      },
      outputSchema: {
        type: 'object',
        properties: { operation_id: { type: 'string' }, status: { type: 'string' } },
        required: ['operation_id', 'status'],
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-generate-video', args.prompt, args.fast ? M.videoFast : M.video, async () => {
          let image = null;
          if (args.image_path) {
            const f = readFileChecked(args.image_path, { maxMb: config.limits.maxImageMb, kinds: ['image/'] });
            image = { data: f.data, mimeType: f.mimeType };
          }
          const op = await gemini.startVideo({
            model: args.fast ? M.videoFast : M.video,
            prompt: args.prompt,
            image,
            aspectRatio: args.aspect_ratio ?? '16:9',
            durationSeconds: args.duration_seconds ?? 8,
          });
          const opId = op?.name ?? JSON.stringify(op).slice(0, 200);
          return {
            content: [{ type: 'text', text: `Video generation started. Operation: ${opId}\nPoll with gemini-poll-video until done.` }],
            structuredContent: { operation_id: opId, status: 'started' },
          };
        });
      },
    },

    // ===== 6. VIDEO GENERATION — poll =====
    {
      name: 'gemini-poll-video',
      title: 'Check video generation status',
      description: 'Poll a Veo operation started by gemini-generate-video. Downloads and saves the MP4 when done.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'object', description: 'The operation object returned by gemini-generate-video (pass through as-is).' },
          operation_id: { type: 'string', description: 'Alternative: the operation name string.' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { done: { type: 'boolean' }, path: { type: 'string' } },
        required: ['done'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-poll-video', 'poll video operation', M.video, async () => {
          const operation = args.operation ?? (args.operation_id ? { name: args.operation_id } : null);
          if (!operation) return errResult('Provide the operation object (or operation_id) from gemini-generate-video.');
          const res = await gemini.pollVideo({ operation });
          if (!res.done) {
            return {
              content: [{ type: 'text', text: 'Still generating. Poll again in ~30s.' }],
              structuredContent: { done: false },
            };
          }
          if (!res.video) return errResult('Operation finished but returned no video.');
          let bytes;
          if (res.video.bytes) bytes = Buffer.from(res.video.bytes, 'base64');
          else if (res.video.uri) bytes = await gemini.downloadUri(res.video.uri, config.apiKey);
          else return errResult('Operation finished but returned no downloadable video.');
          const saved = saveOutput(ctx, bytes, 'mp4');
          return {
            content: [
              { type: 'text', text: `Video ready: ${saved}` },
              { type: 'resource_link', uri: `file://${saved}`, name: path.basename(saved), mimeType: 'video/mp4' },
            ],
            structuredContent: { done: true, path: saved },
          };
        });
      },
    },
  ];

  return [...tools, ...defineToolsPart2(ctx)];
}
