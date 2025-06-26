/**
 * Gemini Model Configurations.
 * Centralizes the model IDs and generation configurations used across tools.
 *
 * @author Cline
 */

const config = require('../config');

/**
 * Retrieves the configuration for a specific Gemini model.
 * @param {string} modelType - The type of model configuration to retrieve (e.g., 'IMAGE_GENERATION').
 * @returns {Object} The model configuration object.
 * @throws {Error} If the modelType is not found in the configuration.
 */
function getGeminiModelConfig(modelType) {
  const modelConfig = config.GEMINI_MODELS[modelType];
  if (!modelConfig) {
    throw new Error(`Gemini model configuration not found for type: ${modelType}`);
  }
  return modelConfig;
}

module.exports = {
  getGeminiModelConfig,
};
