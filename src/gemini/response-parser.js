/**
 * Handles parsing responses from the Gemini API.
 *
 * @author Cline
 */

/**
 * Extracts text content from a Gemini API response candidate.
 * @param {Object} candidate - The candidate object from Gemini API response.
 * @returns {string} The extracted text content.
 */
function extractTextContent(candidate) {
  let responseText = '';
  if (candidate.content?.parts) {
    // eslint-disable-next-line no-restricted-syntax
    for (const part of candidate.content.parts) {
      if (part.text) {
        responseText += part.text;
      }
    }
  }
  return responseText.trim();
}

/**
 * Extracts image data (base64) from a Gemini API response candidate.
 * @param {Object} candidate - The candidate object from Gemini API response.
 * @returns {string|null} The base64 encoded image data, or null if not found.
 */
function extractImageData(candidate) {
  if (candidate.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return part.inlineData.data;
      }
    }
  }
  return null;
}

/**
 * Extracts code execution results from a Gemini API response candidate.
 * @param {Object} candidate - The candidate object from Gemini API response.
 * @returns {Array<Object>} An array of code execution results.
 */
function extractCodeExecutionResults(candidate) {
  const results = [];
  if (candidate.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.functionCall) {
        results.push(part.functionCall);
      }
      if (part.functionResponse) {
        results.push(part.functionResponse);
      }
    }
  }
  return results;
}

module.exports = {
  extractTextContent,
  extractImageData,
  extractCodeExecutionResults,
};
