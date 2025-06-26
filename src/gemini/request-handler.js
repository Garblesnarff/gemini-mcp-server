/**
 * Handles formatting requests for the Gemini API.
 *
 * @author Cline
 */

/**
 * Formats a text-only prompt for Gemini API.
 * @param {string} prompt - The text prompt.
 * @returns {Array<Object>} Content array for Gemini API.
 */
function formatTextPrompt(prompt) {
  return [{ text: prompt }];
}

/**
 * Formats a prompt with inline image data for Gemini API.
 * @param {string} prompt - The text prompt.
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/png').
 * @param {string} base64Data - The base64 encoded image data.
 * @returns {Array<Object>} Content array for Gemini API.
 */
function formatImagePrompt(prompt, mimeType, base64Data) {
  return [{
    parts: [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ],
  }];
}

/**
 * Formats a prompt with inline audio data for Gemini API.
 * @param {string} prompt - The text prompt.
 * @param {string} mimeType - The MIME type of the audio (e.g., 'audio/mpeg').
 * @param {string} base64Data - The base64 encoded audio data.
 * @returns {Array<Object>} Content array for Gemini API.
 */
function formatAudioPrompt(_prompt, mimeType, base64Data) {
  return [{
    parts: [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ],
  }];
}

/**
 * Formats a prompt with inline video data for Gemini API.
 * @param {string} prompt - The text prompt.
 * @param {string} mimeType - The MIME type of the video (e.g., 'video/mp4').
 * @param {string} base64Data - The base64 encoded video data.
 * @returns {Array<Object>} Content array for Gemini API.
 */
function formatVideoPrompt(prompt, mimeType, base64Data) {
  return [{
    parts: [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ],
  }];
}

module.exports = {
  formatTextPrompt,
  formatImagePrompt,
  formatAudioPrompt,
  formatVideoPrompt,
};
