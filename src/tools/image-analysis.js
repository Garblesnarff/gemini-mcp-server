/**
 * Image Analysis Tool for Gemini MCP Server.
 * Analyzes images using Gemini's multimodal vision capabilities.
 *
 * @author Cline
 */

const BaseTool = require('./base-tool');
const { log } = require('../utils/logger');
const { readFileAsBuffer, validateFileSize, getMimeType } = require('../utils/file-utils');
const { validateNonEmptyString, validateString } = require('../utils/validation');
const config = require('../config');

class ImageAnalysisTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'gemini-analyze-image',
      'Analyze images using Gemini\'s multimodal vision capabilities (with learned user preferences)',
      {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the image file to analyze (supports JPEG, PNG, WebP, HEIC, HEIF, BMP, GIF)',
          },
          analysis_type: {
            type: 'string',
            description: 'Type of analysis to perform: "summary", "objects", "text", "detailed", or "custom"',
            enum: ['summary', 'objects', 'text', 'detailed', 'custom'],
          },
          context: {
            type: 'string',
            description: 'Optional context for intelligent enhancement (e.g., "medical", "architectural", "nature")',
          },
        },
        required: ['file_path'],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the image analysis tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} args.file_path - Path to the image file to analyze.
   * @param {string} [args.analysis_type='summary'] - Type of analysis to perform.
   * @param {string} [args.context] - Optional context about the image content.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const filePath = validateNonEmptyString(args.file_path, 'file_path');
    const analysisType = args.analysis_type ? validateString(args.analysis_type, 'analysis_type', ['summary', 'objects', 'text', 'detailed', 'custom']) : 'summary';
    const context = args.context ? validateString(args.context, 'context') : null;

    log(`Analyzing image file: "${filePath}" with analysis type: "${analysisType}" and context: ${context || 'general'}`, this.name);

    try {
      validateFileSize(filePath, config.MAX_IMAGE_SIZE_MB);
      const imageBuffer = readFileAsBuffer(filePath);
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = getMimeType(filePath, config.SUPPORTED_IMAGE_MIMES);

      log(`Image file loaded: ${(imageBuffer.length / 1024).toFixed(2)}KB, MIME type: ${mimeType}`, this.name);

      let baseAnalysisPrompt;
      switch (analysisType) {
        case 'summary':
          baseAnalysisPrompt = 'Please provide a comprehensive summary of this image. Describe what you see, including objects, people, settings, colors, composition, and overall content.'; // eslint-disable-line max-len
          break;
        case 'objects':
          baseAnalysisPrompt = 'Please identify and describe all objects, people, text, and visual elements visible in this image. List them systematically with their locations and characteristics.'; // eslint-disable-line max-len
          break;
        case 'text':
          baseAnalysisPrompt = 'Please extract and transcribe all text visible in this image. Include any signs, labels, captions, or written content you can read.'; // eslint-disable-line max-len
          break;
        case 'detailed':
          baseAnalysisPrompt = 'Please provide a detailed analysis of this image including: visual description, objects and people present, text content, colors and composition, mood or atmosphere, and any notable details or artistic elements.'; // eslint-disable-line max-len
          break;
        case 'custom':
          baseAnalysisPrompt = context || 'Please analyze this image and describe what you observe.';
          break;
        default:
          baseAnalysisPrompt = 'Please provide a summary of this image content.';
      }

      let enhancedAnalysisPrompt = baseAnalysisPrompt;
      if (this.intelligenceSystem.initialized) {
        try {
          enhancedAnalysisPrompt = await this.intelligenceSystem.enhancePrompt(baseAnalysisPrompt, context, this.name);
          log('Applied Tool Intelligence enhancement', this.name);
        } catch (err) {
          log(`Tool Intelligence enhancement failed: ${err.message}`, this.name);
        }
      }

      let analysisPrompt = enhancedAnalysisPrompt;
      if (context && analysisType !== 'custom') {
        analysisPrompt += ` Additional context: ${context}`;
      }

      const analysisText = await this.geminiService.analyzeImage('IMAGE_ANALYSIS', analysisPrompt, imageBase64, mimeType);

      if (analysisText) {
        log('Image analysis completed successfully', this.name);

        if (this.intelligenceSystem.initialized) {
          try {
            const resultSummary = `Image analysis completed successfully: ${analysisText.length} characters, type: ${analysisType}`; // eslint-disable-line max-len
            await this.intelligenceSystem.learnFromInteraction(baseAnalysisPrompt, enhancedAnalysisPrompt, resultSummary, context, this.name);
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        let finalResponse = `✓ Image file analyzed successfully:\n\n**File:** ${filePath}\n**Size:** ${(imageBuffer.length / 1024).toFixed(2)}KB\n**Format:** ${filePath.split('.').pop().toUpperCase()}\n**Analysis Type:** ${analysisType}\n\n**Analysis:**\n${analysisText}`; // eslint-disable-line max-len
        if (context && this.intelligenceSystem.initialized) {
          finalResponse += `\n\n---\n_Enhancement applied based on context: ${context}_`;
        }

        return {
          content: [
            {
              type: 'text',
              text: finalResponse,
            },
          ],
        };
      }
      log('No analysis text generated', this.name);
      return {
        content: [
          {
            type: 'text',
            text: `Could not analyze image file: "${filePath}". The image may be corrupted, too complex, or in an unsupported format.`,
          },
        ],
      };
    } catch (error) {
      log(`Error analyzing image: ${error.message}`, this.name);
      throw new Error(`Error analyzing image: ${error.message}`);
    }
  }
}

module.exports = ImageAnalysisTool;
