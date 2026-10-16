/**
 * The learned user profile.
 *
 * This is the piece v2 never had: a distillation step that turns rated
 * interactions into an explicit, inspectable profile, which is then injected
 * as system instructions. Behavior genuinely changes as evidence accumulates.
 *
 * Profile shape:
 * {
 *   version: 1,
 *   updatedAt: ISO string,
 *   distilledFrom: <count of interactions>,
 *   style: "concise and direct" | ...,
 *   verbosity: "terse" | "balanced" | "detailed",
 *   formats: ["bulleted lists", "code blocks", ...],
 *   interests: ["...", ...],
 *   avoid: ["...", ...],
 *   notes: "freeform observations"
 * }
 */

export const EMPTY_PROFILE = {
  version: 1,
  updatedAt: null,
  distilledFrom: 0,
  style: '',
  verbosity: 'balanced',
  formats: [],
  interests: [],
  avoid: [],
  notes: '',
};

const DISTILL_PROMPT = `You are a preference-distillation assistant. Given a log of a user's rated interactions with an AI assistant, extract stable, long-term preferences.

Rules:
- Only include preferences supported by MULTIPLE interactions or one very strong signal (a 1-star or 5-star rating with a note).
- Be specific and actionable. "likes concise answers" beats "good communicator".
- "avoid" lists things the user disliked (low ratings, corrections, "don't do X" notes).
- Keep each list short (max 6 items). Empty string/array when there is no evidence.
- Output ONLY valid JSON matching this schema, no markdown fences:
{"style": string, "verbosity": "terse"|"balanced"|"detailed", "formats": string[], "interests": string[], "avoid": string[], "notes": string}

Interaction log (most recent last), ratings are 1-5 where given:
`;

function summarizeInteraction(i) {
  const bits = [`tool=${i.tool}`, `intent=${i.intent}`];
  if (i.rating) bits.push(`rating=${i.rating}/5`);
  if (i.note) bits.push(`note="${i.note.slice(0, 200)}"`);
  bits.push(`prompt="${(i.prompt ?? '').slice(0, 160)}"`);
  return `- ${bits.join(' ')}`;
}

/**
 * Ask Gemini to distill preferences from rated interactions.
 * Returns a profile object, or null if distillation isn't possible.
 */
export async function distillProfile({ gemini, model, interactions }) {
  const rated = interactions.filter((i) => i.rating);
  if (rated.length < 3) return null;

  const log = rated.slice(-40).map(summarizeInteraction).join('\n');
  let text;
  try {
    text = await gemini.generateText({
      model,
      contents: [{ role: 'user', parts: [{ text: DISTILL_PROMPT + log }] }],
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    });
  } catch {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
  } catch {
    return null;
  }
  return {
    ...EMPTY_PROFILE,
    style: String(parsed.style ?? ''),
    verbosity: ['terse', 'balanced', 'detailed'].includes(parsed.verbosity) ? parsed.verbosity : 'balanced',
    formats: Array.isArray(parsed.formats) ? parsed.formats.slice(0, 6).map(String) : [],
    interests: Array.isArray(parsed.interests) ? parsed.interests.slice(0, 6).map(String) : [],
    avoid: Array.isArray(parsed.avoid) ? parsed.avoid.slice(0, 6).map(String) : [],
    notes: String(parsed.notes ?? '').slice(0, 500),
    updatedAt: new Date().toISOString(),
    distilledFrom: rated.length,
  };
}

/** Turn a profile into system instructions. Empty profile → null (no injection). */
export function profileToSystemPrompt(profile) {
  if (!profile || (!profile.style && !profile.formats.length && !profile.avoid.length && !profile.notes)) {
    return null;
  }
  const lines = ['User preferences (learned from their feedback — follow these):'];
  if (profile.style) lines.push(`- Communication style: ${profile.style}.`);
  if (profile.verbosity && profile.verbosity !== 'balanced') {
    lines.push(`- Verbosity: prefer ${profile.verbosity} responses.`);
  }
  if (profile.formats.length) lines.push(`- Preferred formats: ${profile.formats.join('; ')}.`);
  if (profile.interests.length) lines.push(`- Interests: ${profile.interests.join('; ')}.`);
  if (profile.avoid.length) lines.push(`- Avoid: ${profile.avoid.join('; ')}.`);
  if (profile.notes) lines.push(`- Notes: ${profile.notes}`);
  return lines.join('\n');
}
