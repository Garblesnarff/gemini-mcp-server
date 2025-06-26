/**
 * Enhances prompts based on detected context and preferences.
 *
 * @author Cline
 */

const { log } = require('../utils/logger');

class PromptEnhancer {
  /**
   * @param {import('./preference-store')} preferenceStore - The PreferenceStore instance.
   */
  constructor(preferenceStore) {
    this.preferenceStore = preferenceStore;
    // Default preferences for Rob (from original tool_intelligence.js)
    this.defaultPreferences = {
      consciousness: {
        style: 'detailed technical',
        requirements: ['citations', 'specific sources', 'academic rigor'],
      },
      code: {
        style: 'practical examples',
        requirements: ['implementation details', 'best practices', 'working code'],
      },
      debugging: {
        style: 'root cause analysis',
        requirements: ['specific fixes', 'detailed explanation', 'prevention tips'],
      },
      general: {
        style: 'technical depth',
        requirements: ['comprehensive', 'accurate', 'well-structured'],
      },
      // Special verbatim context for transcription
      verbatim: {
        style: 'exact word-for-word transcription',
        requirements: ['all utterances', 'pauses', 'filler words', 'complete unedited transcript'],
      },
    };
  }

  /**
   * Applies preferences to enhance the prompt.
   * @param {string} prompt - The original prompt.
   * @param {string} contextKey - The detected context key (e.g., 'consciousness', 'code', 'verbatim').
   * @returns {string} The enhanced prompt.
   */
  enhance(prompt, contextKey, additionalParams = {}) {
    let enhancedPrompt = prompt;

    // Special handling for verbatim context - override all other enhancements
    if (contextKey === 'verbatim') {
      log('Applying verbatim transcription mode', 'prompt-enhancer');
      let verbatimPrompt = prompt + '\n\nProvide an exact word-for-word transcription including all utterances, pauses, filler words (um, uh, etc.), repetitions, and incomplete sentences. Preserve emotional expressions in brackets like [laughs] or [sighs]. ';
      
      if (additionalParams.preserveSpelledAcronyms) {
        verbatimPrompt += 'Keep spelled-out letters exactly as spoken with hyphens (like U-R-L, H-T-T-P-S, not URL or HTTPS). ';
      } else {
        verbatimPrompt += 'Keep spelled-out letters as hyphenated (like U-R-L not URL). ';
      }
      
      verbatimPrompt += 'Maintain original punctuation including ellipses (...) and dashes. Do not add any artifacts or sounds at the end of the transcription. Do not summarize or clean up the text. Include everything exactly as spoken. This is a verbatim transcription so every word, sound, and pause should be captured.';
      
      return verbatimPrompt;
    }

    // Retrieve learned preferences for the context, fallback to default
    const learnedPreferences = this.preferenceStore.getPreferencesForContext(contextKey);
    const effectivePreferences = {
      ...this.defaultPreferences.general, // Start with general defaults
      ...(this.defaultPreferences[contextKey] || {}), // Overlay context-specific defaults
      ...learnedPreferences, // Overlay learned preferences
    };

    log(`Applying preferences for context '${contextKey}': ${JSON.stringify(effectivePreferences)}`, 'prompt-enhancer');

    // Apply style and requirements
    if (effectivePreferences.style) {
      enhancedPrompt += `\n\nAdopt a ${effectivePreferences.style} style.`;
    }
    if (effectivePreferences.requirements && effectivePreferences.requirements.length > 0) {
      enhancedPrompt += ` Ensure the response includes: ${effectivePreferences.requirements.join(', ')}.`;
    }

    return enhancedPrompt;
  }
}

module.exports = PromptEnhancer;
