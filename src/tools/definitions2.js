
/**
 * Tool definitions, part 2: TTS, transcription, analysis, code execution,
 * file upload, search grounding, feedback, and profile management.
 *
 * These are appended to the array returned by defineTools() in definitions.js.
 * Kept in a separate file to keep each file reviewable.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readFileChecked, saveOutput, MIME_BY_EXT } from './definitions.js';

function textResult(text, extra = {}) {
  return { content: [{ type: 'text', text }], ...extra };
}
function errResult(message) {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}
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

const VERBATIM_PROMPT = `Provide an exact word-for-word transcription including all utterances, pauses, filler words (um, uh, etc.), repetitions, and incomplete sentences. Preserve emotional expressions in brackets like [laughs] or [sighs]. Maintain original punctuation including ellipses (...) and dashes. Do not add any artifacts or sounds at the end of the transcription. Do not summarize or clean up the text. Include everything exactly as spoken.`;

const ANALYSIS_PROMPTS = {
  summary: 'Summarize this media briefly: what it shows and the key points.',
  transcript: 'Transcribe all speech in this media verbatim.',
  objects: 'List all notable objects, people, animals, and text visible, with brief descriptions.',
  detailed: 'Give a detailed analysis: describe the content thoroughly, note objects, people, text, mood, and any anomalies.',
};

export function defineToolsPart2(ctx) {
  const { gemini, learning, config } = ctx;
  const M = config.models;

  return [
    // ===== 7. TEXT-TO-SPEECH =====
    {
      name: 'gemini-text-to-speech',
      title: 'Text to speech',
      description: 'Convert text to spoken audio (WAV) with expressive voices. Supports 130+ languages, voice direction, and 2000+ voices.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text to speak (or script with stage directions).' },
          voice: { type: 'string', description: 'Voice name, e.g. Kore, Puck, Zephyr, Charon.', default: 'Kore' },
          style: { type: 'string', description: 'Optional direction, e.g. "cheerful and friendly", "whispered, tense".' },
          language: { type: 'string', description: 'BCP-47 language code, e.g. en-us, fr-fr.', default: 'en-us' },
          lite: { type: 'boolean', description: 'Use the cheaper Flash-Lite TTS model.', default: false },
        },
        required: ['text'],
      },
      outputSchema: {
        type: 'object',
        properties: { path: { type: 'string' }, voice: { type: 'string' } },
        required: ['path'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-text-to-speech', args.text.slice(0, 200), args.lite ? M.ttsLite : M.tts, async () => {
          const audio = await gemini.speak({
            model: args.lite ? M.ttsLite : M.tts,
            text: args.text,
            voice: args.voice ?? 'Kore',
            style: args.style ?? null,
          });
          if (!audio) return errResult('No audio was returned by the TTS model.');
          const saved = saveOutput(ctx, Buffer.from(audio.data, 'base64'), 'wav');
          return {
            content: [
              { type: 'audio', data: audio.data, mimeType: 'audio/wav' },
              { type: 'text', text: `Audio saved to ${saved}` },
            ],
            structuredContent: { path: saved, voice: args.voice ?? 'Kore' },
          };
        });
      },
    },

    // ===== 8. AUDIO TRANSCRIPTION =====
    {
      name: 'gemini-transcribe-audio',
      title: 'Transcribe audio',
      description: 'Convert audio to text. Verbatim mode captures every um, uh, laugh, and pause word-for-word.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the audio file.' },
          verbatim: { type: 'boolean', description: 'Exact word-for-word transcription including filler words.', default: false },
          language: { type: 'string', description: 'Language hint, e.g. en, es, fr.' },
          preserve_spelled_acronyms: { type: 'boolean', description: 'Keep U-R-L instead of URL.', default: false },
        },
        required: ['file_path'],
      },
      outputSchema: {
        type: 'object',
        properties: { text: { type: 'string' }, verbatim: { type: 'boolean' } },
        required: ['text'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-transcribe-audio', `transcribe audio ${args.verbatim ? 'verbatim' : ''}`, M.chat, async () => {
          const f = readFileChecked(args.file_path, { maxMb: config.limits.maxAudioMb, kinds: ['audio/', 'video/'] });
          let prompt = 'Transcribe this audio accurately.';
          if (args.verbatim) {
            prompt = VERBATIM_PROMPT;
            if (args.preserve_spelled_acronyms) prompt += ' Keep spelled-out letters exactly as spoken with hyphens (like U-R-L, not URL).';
          }
          if (args.language) prompt += ` The audio is in language: ${args.language}.`;
          const text = await gemini.transcribe({ model: M.chat, audioBase64: f.data, mimeType: f.mimeType, prompt });
          return {
            content: [{ type: 'text', text }],
            structuredContent: { text, verbatim: !!args.verbatim },
          };
        });
      },
    },

    // ===== 9. IMAGE ANALYSIS =====
    {
      name: 'gemini-analyze-image',
      title: 'Analyze image',
      description: 'Extract summaries, objects, text, or detailed descriptions from images.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the image.' },
          analysis_type: { type: 'string', enum: ['summary', 'objects', 'text', 'detailed'], default: 'detailed' },
          prompt: { type: 'string', description: 'Custom analysis prompt (overrides analysis_type).' },
        },
        required: ['file_path'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-analyze-image', args.prompt ?? `analyze image (${args.analysis_type})`, M.chat, async () => {
          const f = readFileChecked(args.file_path, { maxMb: config.limits.maxImageMb, kinds: ['image/'] });
          const prompt = args.prompt ?? ANALYSIS_PROMPTS[args.analysis_type ?? 'detailed'];
          const { text } = await gemini.analyze({
            model: M.chat,
            parts: [{ inlineData: { mimeType: f.mimeType, data: f.data } }, { text: prompt }],
            systemInstruction: learning.getSystemPrompt() ?? undefined,
          });
          return textResult(text);
        });
      },
    },

    // ===== 10. VIDEO ANALYSIS =====
    {
      name: 'gemini-analyze-video',
      title: 'Analyze video',
      description: 'Summarize, transcribe, or deeply analyze video content.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the video.' },
          analysis_type: { type: 'string', enum: ['summary', 'transcript', 'objects', 'detailed'], default: 'detailed' },
          prompt: { type: 'string', description: 'Custom analysis prompt (overrides analysis_type).' },
        },
        required: ['file_path'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-analyze-video', args.prompt ?? `analyze video (${args.analysis_type})`, M.chat, async () => {
          const f = readFileChecked(args.file_path, { maxMb: config.limits.maxVideoMb, kinds: ['video/'] });
          const prompt = args.prompt ?? ANALYSIS_PROMPTS[args.analysis_type ?? 'detailed'];
          const { text } = await gemini.analyze({
            model: M.chat,
            parts: [{ inlineData: { mimeType: f.mimeType, data: f.data } }, { text: prompt }],
            systemInstruction: learning.getSystemPrompt() ?? undefined,
          });
          return textResult(text);
        });
      },
    },

    // ===== 11. CODE EXECUTION =====
    {
      name: 'gemini-code-execute',
      title: 'Execute code (sandboxed)',
      description: "Run Python code in Gemini's sandboxed code-execution environment. Give a task in plain language, or code directly.",
      inputSchema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'What to compute, in plain language and/or Python code.' },
        },
        required: ['task'],
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-code-execute', args.task.slice(0, 200), M.chat, async () => {
          const { text } = await gemini.codeExecute({ model: M.chat, prompt: args.task });
          return textResult(text);
        });
      },
    },

    // ===== 12. FILE UPLOAD =====
    {
      name: 'gemini-upload-file',
      title: 'Upload file to Gemini',
      description: 'Upload a file to the Gemini File API (up to 2GB). Returns a URI you can reuse in other tools for 48 hours.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the file.' },
        },
        required: ['file_path'],
      },
      outputSchema: {
        type: 'object',
        properties: { uri: { type: 'string' }, name: { type: 'string' } },
        required: ['uri'],
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-upload-file', `upload ${path.basename(args.file_path)}`, M.chat, async () => {
          const abs = path.resolve(args.file_path);
          if (!fs.existsSync(abs)) return errResult(`File not found: ${args.file_path}`);
          const mimeType = MIME_BY_EXT[path.extname(abs).toLowerCase()] ?? 'application/octet-stream';
          const { uri, name } = await gemini.uploadFile({ path: abs, mimeType });
          return {
            content: [{ type: 'text', text: `Uploaded (${mimeType}). URI: ${uri}\nUsable for 48 hours in analysis tools.` }],
            structuredContent: { uri, name },
          };
        });
      },
    },

    // ===== 13. SEARCH (grounded) =====
    {
      name: 'gemini-search',
      title: 'Search-grounded answer',
      description: 'Ask anything and get an answer grounded in live Google Search results, with sources.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The question.' },
        },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
        },
        required: ['answer'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      async run(args) {
        return withLearning(ctx, 'gemini-search', args.query, M.chat, async () => {
          const { text, sources } = await gemini.search({ model: M.chat, query: args.query });
          const withSources = sources.length
            ? `${text}\n\nSources:\n${sources.map((s) => `- ${s}`).join('\n')}`
            : text;
          return {
            content: [{ type: 'text', text: withSources }],
            structuredContent: { answer: text, sources },
          };
        });
      },
    },

    // ===== 14. FEEDBACK (the learning loop's input) =====
    {
      name: 'gemini-feedback',
      title: 'Rate an interaction',
      description: 'Rate the last (or a specific) tool interaction 1-5 with an optional note. This is what the learning system learns from.',
      inputSchema: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, description: '1 = bad, 5 = excellent.' },
          note: { type: 'string', description: 'What was good or bad, e.g. "too verbose", "perfect tone".' },
          interaction_id: { type: 'string', description: 'Specific interaction to rate (defaults to the most recent unrated one).' },
        },
        required: ['rating'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          interaction_id: { type: 'string' },
          distilled: { type: 'boolean' },
        },
        required: ['interaction_id', 'distilled'],
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
      async run(args) {
        const { interactionId, distilled } = await learning.recordFeedback({
          interactionId: args.interaction_id ?? null,
          rating: args.rating,
          note: args.note ?? null,
        });
        const msg = distilled.distilled
          ? `Thanks — rated ${args.rating}/5. Your profile was updated from ${learning.ratedCount()} rated interactions.`
          : `Thanks — rated ${args.rating}/5. (${distilled.ratedSinceLast ?? 0}/${distilled.needed ?? '?'} ratings toward the next profile update.)`;
        return {
          content: [{ type: 'text', text: msg }],
          structuredContent: { interaction_id: interactionId, distilled: !!distilled.distilled },
        };
      },
    },

    // ===== 15. PROFILE (inspect / edit / distill the learning) =====
    {
      name: 'gemini-profile',
      title: 'View or manage learned profile',
      description: 'Inspect what the server has learned about you, edit it directly, force a re-distillation, or reset it.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get', 'set', 'distill', 'reset', 'stats'], default: 'get' },
          profile: {
            type: 'object',
            description: 'For action=set: fields to update (style, verbosity, formats, interests, avoid, notes).',
            properties: {
              style: { type: 'string' },
              verbosity: { type: 'string', enum: ['terse', 'balanced', 'detailed'] },
              formats: { type: 'array', items: { type: 'string' } },
              interests: { type: 'array', items: { type: 'string' } },
              avoid: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
            },
          },
        },
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      async run(args) {
        const action = args.action ?? 'get';
        if (action === 'get') {
          const p = learning.getProfile();
          return textResult(`Learned profile (from ${p.distilledFrom} rated interactions${p.updatedAt ? `, updated ${p.updatedAt}` : ''}):\n${JSON.stringify(p, null, 2)}`);
        }
        if (action === 'stats') {
          return textResult(JSON.stringify({
            interactions: learning.interactionCount(),
            rated: learning.ratedCount(),
            sessions: learning.listSessions(),
          }, null, 2));
        }
        if (action === 'set') {
          const next = learning.setProfile(args.profile ?? {});
          return textResult(`Profile updated:\n${JSON.stringify(next, null, 2)}`);
        }
        if (action === 'distill') {
          const res = await learning.maybeDistill({ force: true });
          return textResult(res.distilled
            ? `Distilled a new profile:\n${JSON.stringify(res.profile, null, 2)}`
            : `No distillation: ${res.reason ?? 'not enough new ratings'}.`);
        }
        if (action === 'reset') {
          learning.resetProfile();
          return textResult('Profile reset. The server will learn from scratch.');
        }
        return errResult(`Unknown action: ${action}`);
      },
    },
  ];
}
