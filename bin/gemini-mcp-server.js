#!/usr/bin/env node

/**
 * CLI entry point for Gemini MCP Server
 */
const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const path = require('path');
const fs = require('fs');
const { createServer } = require('../src/server');
const Config = require('../src/config');
const pkg = require('../package.json');

// Print banner
console.error(
  chalk.cyan(
    figlet.textSync('Gemini MCP', { font: 'Standard' })
  )
);
console.error(chalk.cyan(`v${pkg.version}`));
console.error(chalk.cyan('Model Context Protocol server for Gemini image generation'));
console.error();

// Define CLI options
program
  .version(pkg.version)
  .option('-k, --api-key <key>', 'Google Gemini API key')
  .option('-o, --output-dir <dir>', 'Directory to save generated images')
  .option('-d, --debug', 'Enable debug logging')
  .option('-c, --config <path>', 'Path to custom configuration file')
  .option('-r, --reset-config', 'Reset configuration to defaults')
  .parse(process.argv);

const options = program.opts();

// Initialize configuration
const config = new Config();

// Reset config if requested
if (options.resetConfig) {
  config.reset();
  console.error(chalk.green('Configuration reset to defaults'));
}

// Load custom config file if provided
if (options.config) {
  try {
    const configPath = path.resolve(options.config);
    if (fs.existsSync(configPath)) {
      const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (customConfig.apiKey) config.apiKey = customConfig.apiKey;
      if (customConfig.outputDir) config.outputDir = customConfig.outputDir;
      if (customConfig.debug !== undefined) config.debug = customConfig.debug;
      if (customConfig.modelOptions) config.modelOptions = {
        ...config.modelOptions,
        ...customConfig.modelOptions
      };
      
      console.error(chalk.green(`Loaded configuration from ${configPath}`));
    } else {
      console.error(chalk.yellow(`Config file not found: ${configPath}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error loading config file: ${error.message}`));
  }
}

// Override with command line options
if (options.apiKey) {
  config.apiKey = options.apiKey;
}

if (options.outputDir) {
  config.outputDir = path.resolve(options.outputDir);
}

if (options.debug) {
  config.debug = true;
}

// Verify API key is available
if (!config.apiKey) {
  console.error(chalk.red('No API key provided. Use --api-key option, GEMINI_API_KEY environment variable, or configure with setup command.'));
  process.exit(1);
}

// Start the server
try {
  const server = createServer();
  server.start();
} catch (error) {
  console.error(chalk.red(`Failed to start server: ${error.message}`));
  process.exit(1);
}
