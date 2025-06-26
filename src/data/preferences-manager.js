/**
 * Internal Preferences Manager for the Gemini MCP Server.
 * Handles self-contained preferences storage with automatic migration
 * from external preferences files.
 *
 * @author Assistant
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { log } = require('../utils/logger');
const { ensureDirectoryExists } = require('../utils/file-utils');
const StorageAdapter = require('./storage-adapter');

class PreferencesManager {
  constructor(serverDataDir = null) {
    // Use the provided data directory or default to ../../../data
    this.dataDir = serverDataDir || path.join(__dirname, '..', '..', 'data');
    this.preferencesFile = path.join(this.dataDir, 'tool-preferences.json');
    this.cache = new Map();
    this.storage = new StorageAdapter('json', this.preferencesFile);
    this.migrationCompleted = false;
    this.initialized = false; // Add initialized flag
  }

  /**
   * Initializes the preferences manager, ensuring data directory exists
   * and migrating external preferences if needed.
   */
  async initialize() {
    if (this.initialized) {
      log('PreferencesManager already initialized.', 'preferences-manager');
      return;
    }
    try {
      await this.ensureDataDirectory();
      await this.migrateExternalPreferences();
      await this.loadPreferences();
      this.initialized = true; // Set initialized to true after successful initialization
      log('PreferencesManager initialized successfully', 'preferences-manager');
    } catch (error) {
      log(`Error initializing PreferencesManager: ${error.message}`, 'preferences-manager');
      throw error;
    }
  }

  /**
   * Ensures the data directory exists.
   */
  async ensureDataDirectory() {
    ensureDirectoryExists(this.dataDir, 'preferences-manager');
  }

  /**
   * Migrates external preferences from the old location to internal storage.
   * This provides backwards compatibility for existing users.
   */
  async migrateExternalPreferences() {
    const externalPath = path.join(os.homedir(), 'Claude', 'tool-preferences.json');

    // Check if external file exists but internal doesn't
    if (fs.existsSync(externalPath) && !fs.existsSync(this.preferencesFile)) {
      try {
        log('Migrating external preferences to internal storage...', 'preferences-manager');

        // Read external preferences
        const externalData = JSON.parse(fs.readFileSync(externalPath, 'utf8'));

        // Save to internal storage
        await this.savePreferences(externalData);

        log(`Migration complete. External file preserved at: ${externalPath}`, 'preferences-manager');
        log('You can safely delete the external file if no longer needed.', 'preferences-manager');

        this.migrationCompleted = true;
      } catch (error) {
        log(`Error migrating external preferences: ${error.message}`, 'preferences-manager');
        log('Continuing with fresh preferences...', 'preferences-manager');
      }
    }
  }

  /**
   * Saves preferences to internal storage.
   * @param {Object} preferences - The preferences object to save
   */
  async savePreferences(preferences) {
    try {
      // Ensure preferences has the correct structure
      const dataToSave = {
        patterns: preferences.patterns || {},
        lastUpdated: preferences.lastUpdated || new Date().toISOString(),
        migrationInfo: {
          migrated: this.migrationCompleted,
          migrationDate: this.migrationCompleted ? new Date().toISOString() : null,
        },
      };

      await this.storage.write('preferences', dataToSave);

      // Update cache
      this.cache.set('preferences', dataToSave);

      log('Preferences saved to internal storage', 'preferences-manager');
    } catch (error) {
      log(`Error saving preferences: ${error.message}`, 'preferences-manager');
      throw error;
    }
  }

  /**
   * Loads preferences from internal storage into cache.
   */
  async loadPreferences() {
    try {
      const exists = await this.storage.exists('preferences');

      if (exists) {
        const data = await this.storage.read('preferences');
        this.cache.set('preferences', data);
        log('Loaded preferences from internal storage', 'preferences-manager');
      } else {
        // Initialize with default structure
        const defaultPreferences = {
          patterns: {},
          lastUpdated: new Date().toISOString(),
        };
        this.cache.set('preferences', defaultPreferences);
        log('Initialized with default preferences', 'preferences-manager');
      }
    } catch (error) {
      log(`Error loading preferences: ${error.message}`, 'preferences-manager');
      // Initialize with defaults on error
      this.cache.set('preferences', {
        patterns: {},
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  /**
   * Gets the current preferences from cache.
   * @returns {Object} The preferences object
   */
  getPreferences() {
    return this.cache.get('preferences') || { patterns: {}, lastUpdated: null };
  }

  /**
   * Updates preferences in cache and storage.
   * @param {Object} updates - Partial preferences to update
   */
  async updatePreferences(updates) {
    const current = this.getPreferences();
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    await this.savePreferences(updated);
  }

  /**
   * Gets patterns for a specific context.
   * @param {string} contextKey - The context key (e.g., 'consciousness', 'code')
   * @returns {Array} Array of patterns for the context
   */
  getPatterns(contextKey) {
    const preferences = this.getPreferences();
    return preferences.patterns[contextKey] || [];
  }

  /**
   * Adds a pattern for a specific context.
   * @param {string} contextKey - The context key
   * @param {Object} pattern - The pattern to add
   */
  async addPattern(contextKey, pattern) {
    const preferences = this.getPreferences();

    if (!preferences.patterns[contextKey]) {
      preferences.patterns[contextKey] = [];
    }

    preferences.patterns[contextKey].push(pattern);

    // Keep only last 100 patterns per context
    if (preferences.patterns[contextKey].length > 100) {
      preferences.patterns[contextKey] = preferences.patterns[contextKey].slice(-100);
    }

    await this.savePreferences(preferences);
  }

  /**
   * Clears all preferences (useful for testing).
   */
  async clearPreferences() {
    const emptyPreferences = {
      patterns: {},
      lastUpdated: new Date().toISOString(),
    };
    await this.savePreferences(emptyPreferences);
    log('Preferences cleared', 'preferences-manager');
  }

  /**
   * Exports preferences to a specific path (useful for backups).
   * @param {string} exportPath - Path to export preferences to
   */
  async exportPreferences(exportPath) {
    try {
      const preferences = this.getPreferences();
      fs.writeFileSync(exportPath, JSON.stringify(preferences, null, 2));
      log(`Preferences exported to: ${exportPath}`, 'preferences-manager');
    } catch (error) {
      log(`Error exporting preferences: ${error.message}`, 'preferences-manager');
      throw error;
    }
  }

  /**
   * Imports preferences from a specific path.
   * @param {string} importPath - Path to import preferences from
   */
  async importPreferences(importPath) {
    try {
      const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));
      await this.savePreferences(data);
      log(`Preferences imported from: ${importPath}`, 'preferences-manager');
    } catch (error) {
      log(`Error importing preferences: ${error.message}`, 'preferences-manager');
      throw error;
    }
  }
}

module.exports = PreferencesManager;
