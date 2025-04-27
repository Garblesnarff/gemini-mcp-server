/**
 * Logger module for Gemini MCP Server
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

// Default log directory
const defaultLogDir = path.join(os.homedir(), 'Claude', 'logs');

// Ensure log directory exists
if (!fs.existsSync(defaultLogDir)) {
  fs.mkdirSync(defaultLogDir, { recursive: true });
}

// Log file path
const logFile = process.env.GEMINI_LOG_FILE || path.join(defaultLogDir, 'gemini-image-mcp.log');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Get current log level from environment or default to INFO
const currentLogLevel = process.env.LOG_LEVEL ? 
  (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO) : 
  (process.env.DEBUG === 'true' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO);

/**
 * Write to log file and stderr
 * @param {string} level - Log level
 * @param {string} message - Log message
 */
function log(level, message) {
  if (LOG_LEVELS[level] > currentLogLevel) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [gemini-mcp] ${message}`;
  
  // Write to stderr for visibility
  console.error(logMessage);
  
  // Append to log file
  fs.appendFileSync(logFile, logMessage + '\n');
}

module.exports = {
  debug: (message) => log('DEBUG', message),
  info: (message) => log('INFO', message),
  warn: (message) => log('WARN', message),
  error: (message) => log('ERROR', message),
  setLogFile: (filePath) => {
    logFile = filePath;
    const logDir = path.dirname(filePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  },
};
