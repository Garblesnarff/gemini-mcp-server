/**
 * Main module for Gemini MCP Server
 */
const { createServer } = require('./server');
const Config = require('./config');

module.exports = {
  createServer,
  Config
};
