#!/usr/bin/env node

/**
 * Setup script for Gemini MCP Server
 */
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const Config = require('../src/config');
const pkg = require('../package.json');

// Print banner
console.log(
  chalk.cyan(
    figlet.textSync('Gemini MCP Setup', { font: 'Standard' })
  )
);
console.log(chalk.cyan(`v${pkg.version}`));
console.log(chalk.cyan('Configuration tool for Gemini MCP Server'));
console.log();

// Initialize configuration
const config = new Config();

async function main() {
  console.log(chalk.cyan('This wizard will help you set up the Gemini MCP server for Claude Desktop.\n'));
  
  // Check if Claude Desktop directory exists or create it
  const claudeConfigDir = path.join(os.homedir(), '.config', 'claude');
  const claudeMcpDir = path.join(claudeConfigDir, 'mcp-servers');
  
  if (!fs.existsSync(claudeConfigDir)) {
    console.log(chalk.yellow('Claude Desktop config directory not found. Creating it...'));
    fs.mkdirSync(claudeConfigDir, { recursive: true });
  }
  
  if (!fs.existsSync(claudeMcpDir)) {
    console.log(chalk.yellow('Claude Desktop MCP servers directory not found. Creating it...'));
    fs.mkdirSync(claudeMcpDir, { recursive: true });
  }
  
  // Gather configuration
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your Google Gemini API key:',
      default: config.apiKey || '',
      validate: input => input.trim() !== '' || 'API key is required'
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Directory to save generated images:',
      default: config.outputDir
    },
    {
      type: 'confirm',
      name: 'debug',
      message: 'Enable debug logging?',
      default: config.debug
    },
    {
      type: 'list',
      name: 'model',
      message: 'Select Gemini model to use:',
      choices: [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-2.0-pro'
      ],
      default: config.modelOptions.model
    },
    {
      type: 'number',
      name: 'temperature',
      message: 'Model temperature (lower = more focused, higher = more creative):',
      default: config.modelOptions.temperature,
      validate: input => input >= 0 && input <= 1 || 'Temperature must be between 0 and 1'
    },
    {
      type: 'confirm',
      name: 'setupWrapper',
      message: 'Create wrapper script for Claude Desktop?',
      default: true
    },
    {
      type: 'confirm',
      name: 'updateConfig',
      message: 'Add to Claude Desktop configuration? (requires existing claude_desktop_config.json)',
      default: true
    }
  ]);
  
  // Update configuration
  config.apiKey = answers.apiKey;
  config.outputDir = answers.outputDir;
  config.debug = answers.debug;
  config.modelOptions = {
    ...config.modelOptions,
    model: answers.model,
    temperature: answers.temperature
  };
  
  console.log(chalk.green('\nConfiguration saved successfully!'));
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(answers.outputDir)) {
    fs.mkdirSync(answers.outputDir, { recursive: true });
    console.log(chalk.green(`Created output directory: ${answers.outputDir}`));
  }
  
  // Create wrapper script
  if (answers.setupWrapper) {
    const wrapperPath = path.join(claudeMcpDir, 'gemini-mcp-wrapper.sh');
    const wrapperContent = `#!/bin/bash
# Wrapper script for Gemini Image MCP server

# Set up logging
LOG_DIR="${path.join(os.homedir(), 'Claude', 'logs')}"
LOG_FILE="$LOG_DIR/gemini-image-mcp.log"
mkdir -p "$LOG_DIR"
echo "===================================================" >> "$LOG_FILE"
echo "Starting Gemini Image MCP server at $(date)" >> "$LOG_FILE"

# Ensure output directory exists
mkdir -p "${answers.outputDir}"

# Set environment variables
export GEMINI_API_KEY="${answers.apiKey}"
export OUTPUT_DIR="${answers.outputDir}"
export DEBUG="${answers.debug}"

# Execute the server
exec "${path.join(process.execPath)}" "${path.join(__dirname, 'gemini-mcp-server.js')}" 2>> "$LOG_FILE"
`;

    fs.writeFileSync(wrapperPath, wrapperContent);
    fs.chmodSync(wrapperPath, '755');
    console.log(chalk.green(`Created wrapper script: ${wrapperPath}`));
  }
  
  // Update Claude Desktop configuration
  if (answers.updateConfig) {
    const configPath = path.join(claudeConfigDir, 'claude_desktop_config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const claudeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Add or update gemini-image server configuration
        if (!claudeConfig.mcpServers) {
          claudeConfig.mcpServers = {};
        }
        
        claudeConfig.mcpServers['gemini-image'] = {
          command: '/bin/bash',
          args: [
            '-c',
            path.join(claudeMcpDir, 'gemini-mcp-wrapper.sh')
          ],
          env: {
            GEMINI_API_KEY: answers.apiKey,
            DEBUG: String(answers.debug)
          }
        };
        
        fs.writeFileSync(configPath, JSON.stringify(claudeConfig, null, 4));
        console.log(chalk.green(`Updated Claude Desktop configuration: ${configPath}`));
      } catch (error) {
        console.log(chalk.red(`Error updating Claude Desktop configuration: ${error.message}`));
      }
    } else {
      // Create a example config file that users can reference
      const examplePath = path.join(claudeConfigDir, 'example_gemini_config.json');
      const exampleConfig = {
        mcpServers: {
          'gemini-image': {
            command: '/bin/bash',
            args: [
              '-c',
              path.join(claudeMcpDir, 'gemini-mcp-wrapper.sh')
            ],
            env: {
              GEMINI_API_KEY: answers.apiKey,
              DEBUG: String(answers.debug)
            }
          }
        }
      };
      
      fs.writeFileSync(examplePath, JSON.stringify(exampleConfig, null, 4));
      console.log(chalk.yellow(`Claude Desktop configuration not found. Created example at: ${examplePath}`));
      console.log(chalk.yellow(`Add this to your existing claude_desktop_config.json file.`));
    }
  }
  
  console.log('\n' + chalk.green('✓') + ' Gemini MCP Server setup complete!');
  
  console.log('\n' + chalk.cyan('Next steps:'));
  console.log('1. Restart Claude Desktop to apply changes');
  console.log('2. Ask Claude to generate an image using the generate_image tool');
  console.log('   Example: "Generate an image of a sunset over mountains"\n');
}

main().catch(error => {
  console.error(chalk.red(`Error during setup: ${error.message}`));
  process.exit(1);
});
