#!/usr/bin/env node
/**
 * Gemini MCP Server - Main entry point for the refactored server.
 * This file now acts as a simple bootstrap for the core server logic
 * located in `src/server.js`.
 *
 * @author Cline
 */

const { startServer } = require('./src/server');

// Start the MCP server
startServer();
