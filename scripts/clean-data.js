#!/usr/bin/env node

/**
 * Script to clean/reset the internal data storage.
 * Useful for testing or starting fresh.
 *
 * Usage: node scripts/clean-data.js
 */

const fs = require('fs');
const path = require('path');

async function clean() {
  console.log('=== Gemini MCP Server Data Cleanup ===\n');

  const dataDir = path.join(__dirname, '..', 'data');
  const preferencesFile = path.join(dataDir, 'tool-preferences.json');

  console.log('Data directory:', dataDir);
  console.log('');

  if (!fs.existsSync(preferencesFile)) {
    console.log('✅ No preferences file found. Data directory is already clean.');
    return;
  }

  try {
    // Backup current preferences
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dataDir, `tool-preferences-backup-${timestamp}.json`);

    console.log('📋 Creating backup...');
    fs.copyFileSync(preferencesFile, backupPath);
    console.log('   Backup saved to:', path.basename(backupPath));

    // Prompt for confirmation
    const answer = await prompt('Are you sure you want to delete the preferences file? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Cleanup cancelled.');
      return;
    }

    // Delete preferences file
    console.log('🗑️  Deleting preferences file...');
    fs.unlinkSync(preferencesFile);

    console.log('✅ Cleanup completed successfully!');
    console.log('   Your backup is preserved at:', path.basename(backupPath));
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
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

// Run cleanup
clean().catch(console.error);
