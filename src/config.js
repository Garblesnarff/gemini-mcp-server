/**
 * Configuration management for the Gemini MCP Server.
 * Centralizes all environment-dependent and static configurations.
 *
 * @author Cline (Updated by Assistant)
 */

const path = require('path');
const os = require('os');

const config = {
  /**
   * Gemini API Key.
   * Fetched from process.env.GEMINI_API_KEY or defaults to a placeholder.
   * @type {string}
   */
  API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE', // Placeholder, ensure .env is configured

  /**
   * Directory for output files (e.g., generated images).
   * Fetched from process.env.OUTPUT_DIR or defaults to a subdirectory in user's Claude folder.
   * @type {string}
   */
  OUTPUT_DIR: process.env.OUTPUT_DIR || path.join(os.homedir(), 'Claude', 'gemini-images'),

  /**
   * Debug mode flag.
   * Fetched from process.env.DEBUG or defaults to false.
   * @type {boolean}
   */
  DEBUG: process.env.DEBUG === 'true',

  /**
   * Internal data directory for the server.
   * All server data including preferences is now stored internally.
   * @type {string}
   */
  DATA_DIR: path.join(__dirname, '..', 'data'),

  /**
   * Default tool name for the intelligence system.
   * @type {string}
   */
  TOOL_INTELLIGENCE_NAME: 'gemini-chat',

  /**
   * Maximum file size for image uploads (20MB).
   * @type {number}
   */
  MAX_IMAGE_SIZE_MB: 20,

  /**
   * Maximum file size for audio uploads (20MB).
   * @type {number}
   */
  MAX_AUDIO_SIZE_MB: 20,

  /**
   * Maximum file size for video uploads (100MB).
   * @type {number}
   */
  MAX_VIDEO_SIZE_MB: 100,

  /**
   * Supported image MIME types for analysis/editing.
   * @type {Object.<string, string>}
   */
  SUPPORTED_IMAGE_MIMES: {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
  },

  /**
   * Supported audio MIME types for transcription.
   * @type {Object.<string, string>}
   */
  SUPPORTED_AUDIO_MIMES: {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm',
    '.m4a': 'audio/mp4',
  },

  /**
   * Supported video MIME types for analysis.
   * @type {Object.<string, string>}
   */
  SUPPORTED_VIDEO_MIMES: {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv',
    '.m4v': 'video/mp4',
  },

  /**
   * Gemini model configurations.
   */
  GEMINI_MODELS: {
    IMAGE_GENERATION: {
      model: 'gemini-2.0-flash-preview-image-generation',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      },
    },
    IMAGE_EDITING: {
      model: 'gemini-2.0-flash-preview-image-generation',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
        temperature: 0.3, // Lower temperature for consistent edits
      },
    },
    CHAT: {
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7, // Higher temperature for more conversational responses
        maxOutputTokens: 2048,
      },
    },
    AUDIO_TRANSCRIPTION: {
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1, // Low temperature for accurate transcription
        maxOutputTokens: 2048,
      },
    },
    CODE_EXECUTION: {
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1, // Low temperature for accurate code execution
        maxOutputTokens: 2048,
      },
      tools: [{
        codeExecution: {}, // Enable code execution sandbox
      }],
    },
    VIDEO_ANALYSIS: {
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2, // Low temperature for accurate analysis
        maxOutputTokens: 2048,
      },
    },
    IMAGE_ANALYSIS: {
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2, // Low temperature for accurate analysis
        maxOutputTokens: 2048,
      },
    },
  },
};

// Legacy support - map old TOOL_PREFERENCES_FILE to new internal location
// This is for any code that might still reference the old config key
Object.defineProperty(config, 'TOOL_PREFERENCES_FILE', {
  get() {
    const { log } = require('./utils/logger');
    log('Warning: TOOL_PREFERENCES_FILE is deprecated. Use internal PreferencesManager instead.', 'config');
    return path.join(config.DATA_DIR, 'tool-preferences.json');
  },
});

module.exports = config;
