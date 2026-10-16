/**
 * Thin wrapper around the @google/genai SDK.
 *
 * All Gemini API access goes through here so tools stay dumb and the
 * client can be swapped for a mock in tests (pass { client }).
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';

export function createGemini({ apiKey, client = null, log = () => {} } = {}) {
  const ai = client ?? new GoogleGenAI({ apiKey });

  function partText(response) {
    try {
      return response.text ?? '';
    } catch {
      return '';
    }
  }

  function firstInlineData(response, prefixes = []) {
    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    for (const p of parts) {
      const inline = p.inlineData ?? p.inline_data;
      if (inline?.data && (!prefixes.length || prefixes.some((x) => (inline.mimeType ?? inline.mime_type ?? '').startsWith(x)))) {
        return { mimeType: inline.mimeType ?? inline.mime_type ?? 'application/octet-stream', data: inline.data };
      }
    }
    return null;
  }

  return {
    /** Raw SDK client (escape hatch). */
    raw: ai,

    /** Plain text generation. */
    async generateText({ model, contents, systemInstruction, config = {} }) {
      const res = await ai.models.generateContent({
        model,
        contents,
        config: { ...config, ...(systemInstruction ? { systemInstruction } : {}) },
      });
      return partText(res);
    },

    /** Image generation / editing. Returns { mimeType, data (base64) } | null. */
    async generateImage({ model, prompt, images = [], config = {} }) {
      const parts = [];
      for (const img of images) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }
      parts.push({ text: prompt });
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: { responseModalities: ['TEXT', 'IMAGE'], ...config },
      });
      return { inline: firstInlineData(res, ['image/']), text: partText(res), raw: res };
    },

    /** Audio transcription. */
    async transcribe({ model, audioBase64, mimeType, prompt, config = {} }) {
      const res = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [{ inlineData: { mimeType, data: audioBase64 } }, { text: prompt }],
        }],
        config,
      });
      return partText(res);
    },

    /** Generic multimodal analysis (image/video/files + prompt). */
    async analyze({ model, parts, systemInstruction, config = {} }) {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: { ...config, ...(systemInstruction ? { systemInstruction } : {}) },
      });
      return { text: partText(res), raw: res };
    },

    /** Code execution via Gemini's built-in sandbox tool. */
    async codeExecute({ model, prompt, config = {} }) {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { ...config, tools: [{ codeExecution: {} }] },
      });
      return { text: partText(res), raw: res };
    },

    /** Search-grounded answer. Returns text + sources. */
    async search({ model, query, config = {} }) {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: query }] }],
        config: { ...config, tools: [{ googleSearch: {} }] },
      });
      const text = partText(res);
      const chunks = res?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = chunks
        .map((c) => c.web?.uri)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);
      return { text, sources };
    },

    /** Text-to-speech. Returns { mimeType, data (base64 wav) }. */
    async speak({ model, text, voice = 'Kore', style = null, config = {} }) {
      const parts = [{ text: style ? `${style}\n\n${text}` : text }];
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          ...config,
        },
      });
      return firstInlineData(res, ['audio/']);
    },

    /** Start a Veo video generation. Returns the long-running operation. */
    async startVideo({ model, prompt, image = null, aspectRatio = '16:9', durationSeconds = 8 }) {
      const params = { model, prompt, config: { aspectRatio, durationSeconds } };
      if (image) {
        params.image = { imageBytes: image.data, mimeType: image.mimeType };
      }
      return ai.models.generateVideos(params);
    },

    /** Poll a Veo operation. Returns { done, video?: { uri?, bytes?, mimeType? } }. */
    async pollVideo({ operation }) {
      const op = await ai.operations.getVideosOperation({ operation });
      if (!op.done) return { done: false, operation: op };
      const gen = op.response?.generatedVideos?.[0]?.video;
      if (!gen) return { done: true, video: null };
      if (gen.videoBytes) {
        return { done: true, video: { bytes: gen.videoBytes, mimeType: 'video/mp4' }, operation: op };
      }
      if (gen.uri) {
        return { done: true, video: { uri: gen.uri, mimeType: 'video/mp4' }, operation: op };
      }
      return { done: true, video: null, operation: op };
    },

    /** Download bytes from a (possibly authed) file URI. */
    async downloadUri(uri, apiKeyForAuth) {
      const headers = apiKeyForAuth ? { 'x-goog-api-key': apiKeyForAuth } : {};
      const res = await fetch(uri, { headers });
      if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
      return Buffer.from(await res.arrayBuffer());
    },

    /** Upload a local file to the Gemini File API. Returns { uri, name, mimeType }. */
    async uploadFile({ path, mimeType }) {
      const uploaded = await ai.files.upload({
        file: fs.createReadStream(path),
        config: { mimeType },
      });
      return { uri: uploaded.uri, name: uploaded.name, mimeType: uploaded.mimeType ?? mimeType };
    },

    /** Embed text for intent classification. Returns number[]. */
    async embed({ model, text }) {
      const res = await ai.models.embedContent({ model, contents: text });
      return res?.embeddings?.[0]?.values ?? [];
    },
  };
}
