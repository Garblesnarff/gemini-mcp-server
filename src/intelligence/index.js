/**
 * Intelligence System Coordinator.
 * Integrates context detection, prompt enhancement, and pattern learning.
 * Implemented as a singleton to ensure a single instance across the application.
 *
 * @author Cline
 */

const { log } = require('../utils/logger');
const ContextDetector = require('./context-detector');
const PromptEnhancer = require('./prompt-enhancer');
const PatternLearner = require('./pattern-learner');
const PreferenceStore = require('./preference-store');

class IntelligenceSystem {
  constructor() {
    if (IntelligenceSystem.instance) {
      // eslint-disable-next-line no-constructor-return
      return IntelligenceSystem.instance;
    }

    this.preferenceStore = new PreferenceStore();
    this.contextDetector = new ContextDetector();
    this.promptEnhancer = new PromptEnhancer(this.preferenceStore); // Pass preferenceStore to PromptEnhancer
    this.patternLearner = new PatternLearner(this.preferenceStore);
    this.initialized = false;

    IntelligenceSystem.instance = this;
  }

  /**
   * Initializes the intelligence system by loading preferences.
   */
  async initialize() {
    if (this.initialized) {
      log('Intelligence System already initialized.', 'intelligence-system');
      return;
    }
    try {
      await this.preferenceStore.loadPreferences();
      this.initialized = true;
      log('Intelligence System initialized.', 'intelligence-system');
    } catch (error) {
      log(`Failed to initialize Intelligence System: ${error.message}`, 'intelligence-system');
      this.initialized = false;
    }
  }

  /**
   * Enhances a user prompt based on detected context and learned preferences.
   * @param {string} originalPrompt - The user's original message.
   * @param {string|null} explicitContext - Optional context hint (e.g., "aurora", "debugging", "code").
   * @returns {Promise<string>} Enhanced prompt with applied preferences.
   */
  async enhancePrompt(originalPrompt, explicitContext = null) {
    if (!this.initialized) {
      log('Intelligence System not initialized. Skipping prompt enhancement.', 'intelligence-system');
      return originalPrompt;
    }

    log(
      `Enhancing prompt: "${originalPrompt}" with explicit context: ${explicitContext || 'none'}`,
      'intelligence-system',
    );

    const contextKey = this.contextDetector.detectContext(originalPrompt, explicitContext);
    const enhancedPrompt = this.promptEnhancer.enhance(originalPrompt, contextKey);

    log(
      `Enhanced prompt from: "${originalPrompt}" to: "${enhancedPrompt}" (Context: ${contextKey})`,
      'intelligence-system',
    );
    return enhancedPrompt;
  }

  /**
   * Learns from an interaction and stores successful patterns.
   * @param {string} originalPrompt - The user's original message.
   * @param {string} enhancedPrompt - The prompt after enhancement.
   * @param {string} result - The result from the Gemini API.
   * @param {string|null} explicitContext - Optional context hint.
   * @param {string|null} toolName - Optional tool name for specific learning.
   */
  async learnFromInteraction(originalPrompt, enhancedPrompt, result, explicitContext = null, toolName = null) {
    if (!this.initialized) {
      log('Intelligence System not initialized. Skipping learning.', 'intelligence-system');
      return;
    }

    const contextKey = this.contextDetector.detectContext(originalPrompt, explicitContext);
    await this.patternLearner.learnFromInteraction(originalPrompt, enhancedPrompt, result, contextKey, toolName);
  }
}

// Export a single instance of the IntelligenceSystem
const intelligenceSystemInstance = new IntelligenceSystem();
module.exports = intelligenceSystemInstance;
