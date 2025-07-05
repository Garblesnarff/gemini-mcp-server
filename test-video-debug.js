#!/usr/bin/env node

/**
 * Debug script to test video analysis directly
 */

const GeminiService = require('./src/gemini/gemini-service');
const { readFileSync } = require('fs');
const path = require('path');

async function testVideoAnalysis() {
  console.log('Testing Gemini Video Analysis...\n');
  
  const geminiService = new GeminiService();
  
  // Test 1: Direct file analysis (small file)
  try {
    console.log('Test 1: Direct file analysis');
    const videoPath = '/Users/rob/Claude/mcp-servers/video-audio-mcp/tests/sample.mp4';
    const videoBuffer = readFileSync(videoPath);
    const videoBase64 = videoBuffer.toString('base64');
    const mimeType = 'video/mp4';
    
    console.log(`Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    console.log('Calling analyzeVideo...');
    
    const result = await geminiService.analyzeVideo(
      'VIDEO_ANALYSIS',
      'Please provide a brief summary of this video.',
      videoBase64,
      mimeType
    );
    
    console.log('Success! Analysis result:');
    console.log(result);
  } catch (error) {
    console.error('Error in direct analysis:', error);
  }
  
  // Test 2: File URI analysis
  try {
    console.log('\n\nTest 2: File URI analysis');
    const fileUri = 'https://generativelanguage.googleapis.com/v1beta/files/pcln7rf80zg4';
    const mimeType = 'video/mp4';
    
    console.log(`Using file URI: ${fileUri}`);
    console.log('Calling analyzeVideoFromUri...');
    
    const result = await geminiService.analyzeVideoFromUri(
      'VIDEO_ANALYSIS',
      'Please provide a brief summary of this video.',
      fileUri,
      mimeType
    );
    
    console.log('Success! Analysis result:');
    console.log(result);
  } catch (error) {
    console.error('Error in URI analysis:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

testVideoAnalysis().catch(console.error);
