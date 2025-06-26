/**
 * Gemini API Client Wrapper.
 * Centralizes the initialization and access to the Google Generative AI client.
 *
 * @author Cline
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { log } = require('../utils/logger');

let geminiClient = null;

/**
 * Initializes and returns the Google Generative AI client.
 * Ensures only one instance of the client is created.
 * @returns {GoogleGenerativeAI} The initialized Gemini API client.
 */
function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(config.API_KEY);
    log(`Initialized Gemini API with key: ${config.API_KEY.substring(0, 8)}...`, 'gemini-client');
  }
  return geminiClient;
}

module.exports = {
  getGeminiClient,
};
