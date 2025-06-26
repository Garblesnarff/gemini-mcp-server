/**
 * GeminiService
 * Encapsulates all interactions with the Google Gemini API.
 * Provides methods for generating content using various Gemini models.
 *
 * @author Cline
 */

const { getGeminiClient } = require('./client');
const { getGeminiModelConfig } = require('./models');
const { formatTextPrompt, formatImagePrompt } = require('./request-handler');
const { extractTextContent, extractImageData } = require('./response-parser');
const { log } = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = getGeminiClient();
  }

  /**
   * Generates text content using a specified Gemini model.
   * @param {string} modelType - The type of Gemini model to use (e.g., 'CHAT', 'IMAGE_GENERATION').
   * @param {string} prompt - The text prompt for the generation.
   * @returns {Promise<string>} The generated text content.
   */
  async generateText(modelType, prompt) {
    try {
      const modelConfig = getGeminiModelConfig(modelType);
      // Pass model config including tools if present
      const modelOptions = { model: modelConfig.model };
      if (modelConfig.tools) {
        modelOptions.tools = modelConfig.tools;
      }
      const model = this.genAI.getGenerativeModel(modelOptions);
      const content = formatTextPrompt(prompt);

      // Build request with optional generationConfig
      const request = { contents: [{ parts: content }] };
      if (modelConfig.generationConfig) {
        request.generationConfig = modelConfig.generationConfig;
      }

      const result = await model.generateContent(request);
      log(`Text generation response received from Gemini API for model type: ${modelType}`, 'gemini-service');
      return extractTextContent(result.response?.candidates?.[0]);
    } catch (error) {
      log(`Error generating text with Gemini API for model type ${modelType}: ${error.message}`, 'gemini-service');
      throw new Error(`Gemini text generation failed: ${error.message}`);
    }
  }

  /**
   * Generates image data using a specified Gemini model.
   * @param {string} modelType - The type of Gemini model to use (e.g., 'IMAGE_GENERATION').
   * @param {string} prompt - The text prompt for the image generation.
   * @returns {Promise<string>} The generated image data (base64 encoded).
   */
  async generateImage(modelType, prompt) {
    try {
      const modelConfig = getGeminiModelConfig(modelType);
      // Pass only the model name to getGenerativeModel
      const model = this.genAI.getGenerativeModel({ model: modelConfig.model });
      const content = formatTextPrompt(prompt); // Image generation also uses text prompt

      // Pass the generationConfig to the generateContent method
      const result = await model.generateContent({
        contents: [{ parts: content }],
        generationConfig: modelConfig.generationConfig,
      });
      log(`Image generation response received from Gemini API for model type: ${modelType}`, 'gemini-service');
      return extractImageData(result.response?.candidates?.[0]);
    } catch (error) {
      log(`Error generating image with Gemini API for model type ${modelType}: ${error.message}`, 'gemini-service');
      throw new Error(`Gemini image generation failed: ${error.message}`);
    }
  }

  /**
   * Analyzes an image using a specified Gemini model.
   * @param {string} modelType - The type of Gemini model to use (e.g., 'IMAGE_ANALYSIS').
   * @param {string} prompt - The text prompt for the analysis.
   * @param {string} imageBase64 - Base64 encoded image data.
   * @param {string} mimeType - The MIME type of the image (e.g., 'image/png', 'image/jpeg').
   * @returns {Promise<string>} The analysis result text.
   */
  async analyzeImage(modelType, prompt, imageBase64, mimeType) {
    try {
      const modelConfig = getGeminiModelConfig(modelType);
      // Pass only the model name to getGenerativeModel
      const model = this.genAI.getGenerativeModel({ model: modelConfig.model });
      const content = formatImagePrompt(prompt, mimeType, imageBase64);

      // Build request with optional generationConfig
      const request = { contents: content };
      if (modelConfig.generationConfig) {
        request.generationConfig = modelConfig.generationConfig;
      }

      const result = await model.generateContent(request);
      log(`Image analysis response received from Gemini API for model type: ${modelType}`, 'gemini-service');
      
      // For IMAGE_EDITING, extract image data; otherwise extract text
      if (modelType === 'IMAGE_EDITING') {
        return extractImageData(result.response?.candidates?.[0]);
      }
      return extractTextContent(result.response?.candidates?.[0]);
    } catch (error) {
      log(`Error analyzing image with Gemini API for model type ${modelType}: ${error.message}`, 'gemini-service');
      throw new Error(`Gemini image analysis failed: ${error.message}`);
    }
  }

  /**
   * Transcribes audio using a specified Gemini model.
   * @param {string} modelType - The type of Gemini model to use (e.g., 'AUDIO_TRANSCRIPTION').
   * @param {string} audioBase64 - Base64 encoded audio data.
   * @param {string} mimeType - The MIME type of the audio (e.g., 'audio/mpeg', 'audio/wav').
   * @returns {Promise<string>} The transcribed text.
   */
  async transcribeAudio(modelType, audioBase64, mimeType) {
    try {
      const modelConfig = getGeminiModelConfig(modelType);
      const model = this.genAI.getGenerativeModel({ model: modelConfig.model });
      const content = [{
        parts: [{
          inlineData: {
            data: audioBase64,
            mimeType,
          },
        }],
      }];

      const result = await model.generateContent({ contents: content });
      log(`Audio transcription response received from Gemini API for model type: ${modelType}`, 'gemini-service');
      return extractTextContent(result.response?.candidates?.[0]);
    } catch (error) {
      log(`Error transcribing audio with Gemini API for model type ${modelType}: ${error.message}`, 'gemini-service');
      throw new Error(`Gemini audio transcription failed: ${error.message}`);
    }
  }

  /**
   * Analyzes video using a specified Gemini model.
   * @param {string} modelType - The type of Gemini model to use (e.g., 'VIDEO_ANALYSIS').
   * @param {string} prompt - The text prompt for the analysis.
   * @param {string} videoBase64 - Base64 encoded video data.
   * @param {string} mimeType - The MIME type of the video (e.g., 'video/mp4', 'video/webm').
   * @returns {Promise<string>} The analysis result text.
   */
  async analyzeVideo(modelType, prompt, videoBase64, mimeType) {
    try {
      const modelConfig = getGeminiModelConfig(modelType);
      const model = this.genAI.getGenerativeModel({ model: modelConfig.model });
      const content = [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: videoBase64,
              mimeType,
            },
          },
        ],
      }];

      const result = await model.generateContent({ contents: content });
      log(`Video analysis response received from Gemini API for model type: ${modelType}`, 'gemini-service');
      return extractTextContent(result.response?.candidates?.[0]);
    } catch (error) {
      log(`Error analyzing video with Gemini API for model type ${modelType}: ${error.message}`, 'gemini-service');
      throw new Error(`Gemini video analysis failed: ${error.message}`);
    }
  }
}

module.exports = GeminiService;
