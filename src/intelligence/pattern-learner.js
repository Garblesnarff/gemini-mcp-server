/**
 * Manages the learning of interaction patterns.
 *
 * @author Cline
 */

const { log } = require('../utils/logger');

class PatternLearner {
  constructor(preferenceStore) {
    this.preferenceStore = preferenceStore;
  }

  /**
   * Learns from an interaction and stores successful patterns.
   * @param {string} originalPrompt - The user's original message.
   * @param {string} enhancedPrompt - The prompt after enhancement.
   * @param {string} result - The result from the Gemini API.
   * @param {string} contextKey - The detected context key.
   * @param {string|null} toolName - The name of the tool that executed the interaction.
   */
  async learnFromInteraction(originalPrompt, enhancedPrompt, result, contextKey, toolName = null) {
    log(`Learning from interaction: context=${contextKey}, tool=${toolName || 'N/A'}`, 'pattern-learner');

    const pattern = {
      original: originalPrompt,
      enhanced: enhancedPrompt,
      context: contextKey,
      tool: toolName, // Store the tool name
      timestamp: new Date().toISOString(),
      success: true, // In future, we could analyze result to determine success
    };

    this.preferenceStore.addPattern(contextKey, pattern);
    // The preferenceStore.addPattern now handles saving internally, no need to call savePreferences explicitly
    log(`Stored interaction pattern for context: ${contextKey}`, 'pattern-learner');
  }
}

module.exports = PatternLearner;
