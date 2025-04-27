#!/usr/bin/env node

/**
 * Post-installation script for Gemini MCP Server
 */
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log(chalk.cyan('Gemini MCP Server - Post Installation'));

// Make bin scripts executable
try {
  const binDir = path.join(__dirname);
  const files = ['gemini-mcp-server.js', 'setup.js'];
  
  files.forEach(file => {
    const filePath = path.join(binDir, file);
    if (fs.existsSync(filePath)) {
      fs.chmodSync(filePath, '755');
    }
  });
  
  console.log(chalk.green('Made executable scripts in bin directory'));
} catch (error) {
  console.error(chalk.yellow(`Warning: Could not make scripts executable: ${error.message}`));
}

// Check if necessary directories exist and create them
try {
  const requiredDirs = [
    path.join(os.homedir(), 'Claude', 'gemini-images'),
    path.join(os.homedir(), 'Claude', 'logs')
  ];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(chalk.green(`Created directory: ${dir}`));
    }
  }
} catch (error) {
  console.error(chalk.yellow(`Warning: Could not create directories: ${error.message}`));
}

console.log(chalk.green('\nInstallation completed successfully!'));
console.log(chalk.cyan('\nTo configure the Gemini MCP server, run:'));
console.log('  npx gemini-mcp-setup');
console.log(chalk.cyan('\nTo start the server manually, run:'));
console.log('  npx gemini-mcp-server');
