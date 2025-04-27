/**
 * Configuration module for Gemini MCP Server
 */
const os = require('os');
const path = require('path');
const Conf = require('conf');

class Config {
  constructor(options = {}) {
    this.store = new Conf({
      projectName: 'gemini-mcp-server',
      defaults: {
        apiKey: '',
        outputDir: path.join(os.homedir(), 'Claude', 'gemini-images'),
        debug: false,
        modelOptions: {
          model: 'gemini-2.0-flash-exp',
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        },
        logsDir: path.join(os.homedir(), 'Claude', 'logs'),
      },
      ...options
    });
  }

  get apiKey() {
    return this.store.get('apiKey');
  }

  set apiKey(value) {
    this.store.set('apiKey', value);
  }

  get outputDir() {
    return this.store.get('outputDir');
  }

  set outputDir(value) {
    this.store.set('outputDir', value);
  }

  get debug() {
    return this.store.get('debug');
  }

  set debug(value) {
    this.store.set('debug', value);
  }

  get modelOptions() {
    return this.store.get('modelOptions');
  }

  set modelOptions(value) {
    this.store.set('modelOptions', value);
  }

  get logsDir() {
    return this.store.get('logsDir');
  }

  set logsDir(value) {
    this.store.set('logsDir', value);
  }

  // Override config with environment variables if they exist
  loadFromEnv() {
    if (process.env.GEMINI_API_KEY) {
      this.apiKey = process.env.GEMINI_API_KEY;
    }
    
    if (process.env.OUTPUT_DIR) {
      this.outputDir = process.env.OUTPUT_DIR;
    }
    
    if (process.env.DEBUG) {
      this.debug = process.env.DEBUG === 'true';
    }
    
    if (process.env.LOGS_DIR) {
      this.logsDir = process.env.LOGS_DIR;
    }
    
    return this;
  }

  // Reset configuration to defaults
  reset() {
    this.store.clear();
    return this;
  }
}

module.exports = Config;
