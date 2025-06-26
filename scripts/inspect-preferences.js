#!/usr/bin/env node

/**
 * Script to inspect the current preferences.
 * Shows what patterns have been learned by the intelligence system.
 *
 * Usage: node scripts/inspect-preferences.js
 */

const fs = require('fs');
const path = require('path');

// Add parent directory to require paths
// eslint-disable-next-line no-underscore-dangle, global-require
require('module').Module._nodeModulePaths = (from) => {
  const paths = [];
  let current = from;

  while (current !== path.dirname(current)) {
    paths.push(path.join(current, 'node_modules'));
    current = path.dirname(current);
  }

  paths.push(path.join(__dirname, '..', 'src')); // Add src directory
  return paths;
};

const PreferencesManager = require('../src/data/preferences-manager');

async function inspect() {
  console.log('=== Gemini MCP Server Preferences Inspector ===\n');

  try {
    // Initialize preferences manager
    const manager = new PreferencesManager();
    await manager.initialize();

    // Get preferences
    const preferences = manager.getPreferences();

    if (!preferences || !preferences.patterns || Object.keys(preferences.patterns).length === 0) {
      console.log('📭 No preferences found.');
      console.log('   The intelligence system hasn\'t learned any patterns yet.');
      return;
    }

    // Display overview
    console.log('📊 Preferences Overview:');
    console.log('   Last Updated:', preferences.lastUpdated || 'Unknown');

    if (preferences.migrationInfo) {
      console.log('   Migration Status:', preferences.migrationInfo.migrated ? 'Migrated' : 'Not migrated');
      if (preferences.migrationInfo.migrationDate) {
        console.log('   Migration Date:', preferences.migrationInfo.migrationDate);
      }
    }
    console.log('');

    // Display patterns by context
    const contexts = Object.keys(preferences.patterns);
    console.log(`📚 Found ${contexts.length} contexts:\n`);

    contexts.forEach((context, idx) => {
      const patterns = preferences.patterns[context] || [];
      console.log(`${idx + 1}. ${context.toUpperCase()} (${patterns.length} patterns)`);

      // Show last 3 patterns for each context
      const recentPatterns = patterns.slice(-3);
      recentPatterns.forEach((pattern, pidx) => {
        console.log(`   Pattern ${patterns.length - (2 - pidx)}:`);
        console.log(`   - Original: ${truncate(pattern.original, 60)}`);
        console.log(`   - Enhanced: ${truncate(pattern.enhanced, 60)}`);
        console.log(`   - Success: ${pattern.success}`);
        console.log(`   - Time: ${new Date(pattern.timestamp).toLocaleString()}`);
        if (pidx < recentPatterns.length - 1) console.log('');
      });

      if (patterns.length > 3) {
        console.log(`   ... and ${patterns.length - 3} more patterns`);
      }

      if (idx < contexts.length - 1) console.log('');
    });

    // Storage info
    console.log('\n💾 Storage Information:');
    const internalPath = path.join(__dirname, '..', 'data', 'tool-preferences.json');
    if (fs.existsSync(internalPath)) {
      const stats = fs.statSync(internalPath);
      console.log(`   File Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Location: ${internalPath}`);
    }
  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
  }
}

const truncate = (str, maxLength) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
};

// Run inspection
inspect().catch(console.error);
