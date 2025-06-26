#!/usr/bin/env node

/**
 * Migration script for moving external preferences to internal storage.
 * This can be run manually if automatic migration fails.
 *
 * Usage: node scripts/migrate-preferences.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Add parent directory to require paths so we can load src modules
// eslint-disable-next-line no-underscore-dangle, global-require
require('module').Module._nodeModulePaths = (from) => {
  const paths = [];
  let current = from;

  while (current !== path.dirname(current)) {
    paths.push(path.join(current, 'node_modules'));
    current = path.dirname(current);
  }

  // Add src directory
  paths.push(path.join(__dirname, '..', 'src'));

  return paths;
};

const PreferencesManager = require('../src/data/preferences-manager');

async function migrate() {
  console.log('=== Gemini MCP Server Preferences Migration ===\n');

  const externalPath = path.join(os.homedir(), 'Claude', 'tool-preferences.json');
  const internalPath = path.join(__dirname, '..', 'data', 'tool-preferences.json');

  console.log('External preferences path:', externalPath);
  console.log('Internal preferences path:', internalPath);
  console.log('');

  // Check if external file exists
  if (!fs.existsSync(externalPath)) {
    console.log('❌ No external preferences file found.');
    console.log('   Nothing to migrate.');
    return;
  }

  // Check if internal file already exists
  if (fs.existsSync(internalPath)) {
    console.log('⚠️  Internal preferences file already exists.');
    console.log('   Migration may have already been completed.');

    const answer = await prompt('Do you want to overwrite the internal preferences? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Migration cancelled.');
      return;
    }
  }

  try {
    // Initialize preferences manager
    const manager = new PreferencesManager();
    await manager.initialize();

    // Read external preferences
    console.log('📖 Reading external preferences...');
    const externalData = JSON.parse(fs.readFileSync(externalPath, 'utf8'));

    // Display summary
    const contexts = Object.keys(externalData.patterns || {});
    const totalPatterns = contexts.reduce((sum, ctx) => sum + (externalData.patterns[ctx] || []).length, 0);

    console.log(`   Found ${contexts.length} contexts with ${totalPatterns} total patterns`);
    contexts.forEach((ctx) => {
      const count = (externalData.patterns[ctx] || []).length;
      console.log(`   - ${ctx}: ${count} patterns`);
    });
    console.log('');

    // Import preferences
    console.log('💾 Importing preferences to internal storage...');
    await manager.importPreferences(externalPath);

    // Verify
    const stats = await manager.getStats();
    console.log('✅ Migration completed successfully!');
    console.log(`   Total patterns migrated: ${stats.totalPatterns}`);
    console.log('');

    console.log('📋 Next steps:');
    console.log('   1. Test the Gemini MCP server to ensure it works correctly');
    console.log('   2. The external file has been preserved at:', externalPath);
    console.log('   3. You can safely delete it once you confirm everything works');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Please check the error and try again.');
  }
}

// Simple prompt function
const prompt = (question) => {
  // eslint-disable-next-line global-require
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Run migration
migrate().catch(console.error);
