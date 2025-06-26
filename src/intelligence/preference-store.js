/**
 * Persistence layer for learning user preferences.
 * Now uses internal PreferencesManager for self-contained storage.
 *
 * @author Cline (Updated by Assistant)
 */

const { log } = require('../utils/logger');
const PreferencesManager = require('../data/preferences-manager');

class PreferenceStore {
  constructor() {
    this.manager = new PreferencesManager();
    this.initialized = false;
  }

  /**
   * Initializes the preference store and underlying manager.
   */
  async initialize() {
    if (!this.initialized) {
      await this.manager.initialize();
      this.initialized = true;
    }
  }

  /**
   * Loads preferences from the internal storage.
   * For backwards compatibility with existing code.
   */
  async loadPreferences() {
    try {
      await this.initialize();
      log('Loaded preferences from internal storage', 'preference-store');
    } catch (error) {
      log(`Error loading preferences: ${error.message}`, 'preference-store');
    }
  }

  /**
   * Saves preferences to the internal storage.
   * For backwards compatibility with existing code.
   */
  async savePreferences() {
    try {
      // The manager automatically saves when patterns are added
      log('Preferences auto-saved by internal manager', 'preference-store');
    } catch (error) {
      log(`Error in save preferences: ${error.message}`, 'preference-store');
    }
  }

  /**
   * Gets the cached patterns for a given context key.
   * @param {string} contextKey - The key for the context (e.g., 'consciousness', 'code').
   * @returns {Array<Object>} An array of learned patterns.
   */
  getPatterns(contextKey) {
    if (!this.initialized) {
      log('Warning: Getting patterns before initialization', 'preference-store');
      return [];
    }
    return this.manager.getPatterns(contextKey);
  }

  /**
   * Gets the learned preferences for a given context key.
   * This method is used by the PromptEnhancer.
   * @param {string} contextKey - The key for the context.
   * @returns {Object} An object containing learned preferences (e.g., style, requirements).
   */
  getPreferencesForContext(contextKey) {
    if (!this.initialized) {
      log('Warning: Getting preferences for context before initialization', 'preference-store');
      return {};
    }
    // This is a placeholder. In a real system, this would aggregate preferences
    // from learned patterns, e.g., by analyzing successful interactions.
    // For now, it returns a dummy preference based on context.
    const patterns = this.manager.getPatterns(contextKey);
    if (patterns.length > 0) {
      // Example: if there are patterns, suggest a more concise style
      return { style: 'concise', requirements: ['key points'] };
    }
    return {};
  }

  /**
   * Adds a pattern to the cache for a given context key.
   * @param {string} contextKey - The key for the context.
   * @param {Object} pattern - The pattern object to store.
   */
  async addPattern(contextKey, pattern) {
    await this.initialize();
    await this.manager.addPattern(contextKey, pattern);
    await this.savePreferences(); // Ensure preferences are saved after adding a pattern
  }

  /**
   * Exports preferences to a specific path (useful for backups).
   * @param {string} exportPath - Path to export preferences to
   */
  async exportPreferences(exportPath) {
    await this.initialize();
    await this.manager.exportPreferences(exportPath);
  }

  /**
   * Imports preferences from a specific path.
   * @param {string} importPath - Path to import preferences from
   */
  async importPreferences(importPath) {
    await this.initialize();
    await this.manager.importPreferences(importPath);
  }

  /**
   * Gets storage statistics.
   * @returns {Object} Storage statistics
   */
  async getStats() {
    await this.initialize();
    const preferences = this.manager.getPreferences();
    const patternCount = Object.keys(preferences.patterns).reduce((total, key) => total + (preferences.patterns[key] || []).length, 0);

    return {
      contextCount: Object.keys(preferences.patterns).length,
      totalPatterns: patternCount,
      lastUpdated: preferences.lastUpdated,
      migrationInfo: preferences.migrationInfo,
    };
  }
}

module.exports = PreferenceStore;
