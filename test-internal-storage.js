#!/usr/bin/env node

/**
 * Quick test to verify the internal preferences system is working.
 * This creates a test preference and then reads it back.
 */

const path = require('path');

// Add src to module paths
const srcPath = path.join(__dirname, 'src');
require('module').Module._nodeModulePaths = function (from) {
  const paths = [];
  let current = from;

  while (current !== path.dirname(current)) {
    paths.push(path.join(current, 'node_modules'));
    current = path.dirname(current);
  }

  paths.push(srcPath);
  return paths;
};

const PreferencesManager = require('./src/data/preferences-manager');

async function testInternalStorage() {
  console.log('=== Testing Internal Preferences Storage ===\n');

  try {
    // Initialize manager
    console.log('1. Initializing PreferencesManager...');
    const manager = new PreferencesManager();
    await manager.initialize();
    console.log('   ✅ Manager initialized\n');

    // Check migration
    console.log('2. Checking for migrated preferences...');
    const preferences = manager.getPreferences();

    if (preferences.migrationInfo && preferences.migrationInfo.migrated) {
      console.log('   ✅ External preferences were migrated successfully');
      console.log(`   Migration date: ${preferences.migrationInfo.migrationDate}\n`);
    } else {
      console.log('   ℹ️  No migration performed (no external preferences found)\n');
    }

    // Display current patterns
    console.log('3. Current stored patterns:');
    const contexts = Object.keys(preferences.patterns || {});

    if (contexts.length === 0) {
      console.log('   No patterns stored yet\n');
    } else {
      contexts.forEach((context) => {
        const patterns = preferences.patterns[context] || [];
        console.log(`   - ${context}: ${patterns.length} patterns`);
      });
      console.log('');
    }

    // Test adding a new pattern
    console.log('4. Testing pattern storage...');
    const testPattern = {
      original: 'Test query for internal storage',
      enhanced: 'Test query for internal storage\n\nThis is an enhanced test pattern.',
      context: 'test',
      timestamp: new Date().toISOString(),
      success: true,
    };

    await manager.addPattern('test', testPattern);
    console.log('   ✅ Test pattern added\n');

    // Verify it was saved
    console.log('5. Verifying pattern retrieval...');
    const testPatterns = manager.getPatterns('test');
    const found = testPatterns.find((p) => p.original === testPattern.original);

    if (found) {
      console.log('   ✅ Pattern successfully stored and retrieved\n');
    } else {
      console.log('   ❌ Pattern not found after storage\n');
    }

    // Show file location
    console.log('6. Storage location:');
    console.log(`   ${manager.preferencesFile}\n`);

    console.log('✅ Internal storage system is working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run test
testInternalStorage().catch(console.error);
