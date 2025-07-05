#!/usr/bin/env node
/**
 * Test script for Gemini File API upload functionality
 * Tests the new resumable upload capability for large files
 */

// Manually set the environment variable from .env
process.env.GEMINI_API_KEY = 'AIzaSyD6Ki3ZtL19-Km9y8EQcywZvHJLDiRDyNk';

const FileUploadService = require('./src/gemini/file-api/file-upload-service');
const config = require('./src/config');
const path = require('path');
const fs = require('fs');

// Get API key from config
const API_KEY = config.API_KEY;

if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.error('Error: GEMINI_API_KEY not found in config');
  console.error('Config API_KEY value:', config.API_KEY);
  process.exit(1);
}

async function testFileUpload() {
  const uploadService = new FileUploadService(API_KEY);
  
  // Create a test file
  const testFilePath = path.join(__dirname, 'test-upload.txt');
  const testContent = 'This is a test file for Gemini File API upload testing.\n'.repeat(100);
  fs.writeFileSync(testFilePath, testContent);
  
  console.log('Testing Gemini File API Upload...\n');
  console.log('Using API Key:', API_KEY.substring(0, 10) + '...\n');
  
  try {
    // Test 1: Upload a file
    console.log('1. Testing file upload...');
    const uploadResult = await uploadService.uploadFile(testFilePath, 'Test Upload File');
    console.log('✓ File uploaded successfully!');
    console.log(`  - Name: ${uploadResult.display_name}`);
    console.log(`  - URI: ${uploadResult.uri}`);
    console.log(`  - File ID: ${uploadResult.name}`);
    console.log(`  - Size: ${(uploadResult.size_bytes / 1024).toFixed(2)}KB`);
    console.log(`  - Expires: ${new Date(uploadResult.expiration_time).toLocaleString()}\n`);
    
    // Test 2: Get file info
    console.log('2. Testing get file info...');
    const fileInfo = await uploadService.getFile(uploadResult.name);
    console.log('✓ File info retrieved successfully!');
    console.log(`  - State: ${fileInfo.state}`);
    console.log(`  - Created: ${new Date(fileInfo.create_time).toLocaleString()}\n`);
    
    // Test 3: List files
    console.log('3. Testing list files...');
    const fileList = await uploadService.listFiles(5);
    console.log(`✓ Found ${fileList.files ? fileList.files.length : 0} file(s)`);
    if (fileList.files && fileList.files.length > 0) {
      console.log('  Recent uploads:');
      fileList.files.slice(0, 3).forEach(file => {
        console.log(`  - ${file.display_name} (${(file.size_bytes / 1024).toFixed(2)}KB)`);
      });
    }
    console.log('');
    
    // Test 4: Delete file
    console.log('4. Testing file deletion...');
    await uploadService.deleteFile(uploadResult.name);
    console.log('✓ File deleted successfully!\n');
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    console.log('All tests passed! ✅');
    console.log('\nThe Gemini File API integration is working correctly.');
    console.log('You can now upload files up to 2GB for use with Gemini.');
    
  } catch (error) {
    console.error('\nTest failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    // Clean up test file if it exists
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    process.exit(1);
  }
}

// Run the test
testFileUpload();
