/**
 * Centralized logging utility for the Gemini MCP Server.
 * Logs messages to stderr, optionally prefixed with a module name.
 *
 * @author Cline
 */

const DEBUG = process.env.DEBUG === 'true';

/**
 * Logs a message to stderr.
 * @param {string} message - The message to log.
 * @param {string} [moduleName='gemini'] - The name of the module logging the message.
 */
function log(message, moduleName = 'gemini') {
  if (DEBUG) {
    console.error(`[${moduleName}] ${message}`);
  }
}

module.exports = {
  log,
};
