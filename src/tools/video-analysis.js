/**
 * Video Analysis Tool for Gemini MCP Server.
 * Analyzes video files using Gemini's multimodal video understanding capabilities.
 *
 * @author Cline
 */

const BaseTool = require('./base-tool');
const { log } = require('../utils/logger');
const { readFileAsBuffer, validateFileSize, getMimeType } = require('../utils/file-utils');
const { validateNonEmptyString, validateString } = require('../utils/validation');
const config = require('../config');

class VideoAnalysisTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'gemini-analyze-video',
      'Analyze video files using Gemini\'s multimodal video understanding capabilities (with learned user preferences)',
      {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the video file to analyze (supports MP4, MOV, AVI, WEBM, MKV, FLV)',
          },
          analysis_type: {
            type: 'string',
            description: 'Type of analysis to perform: "summary", "transcript", "objects", "detailed", or "custom"',
            enum: ['summary', 'transcript', 'objects', 'detailed', 'custom'],
          },
          context: {
            type: 'string',
            description: 'Optional context for intelligent enhancement (e.g., "security", "educational", "entertainment")',
          },
        },
        required: ['file_path'],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the video analysis tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} args.file_path - Path to the video file to analyze.
   * @param {string} [args.analysis_type='summary'] - Type of analysis to perform.
   * @param {string} [args.context] - Optional context about the video content.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const filePath = validateNonEmptyString(args.file_path, 'file_path');
    const analysisType = args.analysis_type ? validateString(args.analysis_type, 'analysis_type', ['summary', 'transcript', 'objects', 'detailed', 'custom']) : 'summary';
    const context = args.context ? validateString(args.context, 'context') : null;

    log(`Analyzing video file: "${filePath}" with analysis type: "${analysisType}" and context: ${context || 'general'}`, this.name);

    try {
      validateFileSize(filePath, config.MAX_VIDEO_SIZE_MB);
      const videoBuffer = readFileAsBuffer(filePath);
      const videoBase64 = videoBuffer.toString('base64');
      const mimeType = getMimeType(filePath, config.SUPPORTED_VIDEO_MIMES);

      log(`Video file loaded: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)}MB, MIME type: ${mimeType}`, this.name);

      let baseAnalysisPrompt;
      switch (analysisType) {
        case 'summary':
          baseAnalysisPrompt = 'Please provide a comprehensive summary of this video. Describe what happens, who appears, key scenes, and the overall content.'; // eslint-disable-line max-len
          break;
        case 'transcript':
          baseAnalysisPrompt = 'Please transcribe all spoken content in this video. Provide the complete text of dialogue, narration, and any other spoken words with timestamps if possible.'; // eslint-disable-line max-len
          break;
        case 'objects':
          baseAnalysisPrompt = 'Please identify and describe all objects, people, locations, and visual elements visible in this video. List them systematically and note when they appear.'; // eslint-disable-line max-len
          break;
        case 'detailed':
          baseAnalysisPrompt = 'Please provide a detailed analysis of this video including: summary of content, visual elements, audio/speech transcription, scene changes, key moments, and any notable details.'; // eslint-disable-line max-len
          break;
        case 'custom':
          baseAnalysisPrompt = context || 'Please analyze this video and describe what you observe.';
          break;
        default:
          baseAnalysisPrompt = 'Please provide a summary of this video content.';
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

      const analysisText = await this.geminiService.analyzeVideo('VIDEO_ANALYSIS', analysisPrompt, videoBase64, mimeType);

      if (analysisText) {
        log('Video analysis completed successfully', this.name);

        if (this.intelligenceSystem.initialized) {
          try {
            const resultSummary = `Video analysis completed successfully: ${analysisText.length} characters, type: ${analysisType}`; // eslint-disable-line max-len
            await this.intelligenceSystem.learnFromInteraction(baseAnalysisPrompt, enhancedAnalysisPrompt, resultSummary, context, this.name);
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        let finalResponse = `✓ Video file analyzed successfully:\n\n**File:** ${filePath}\n**Size:** ${(videoBuffer.length / (1024 * 1024)).toFixed(2)}MB\n**Format:** ${filePath.split('.').pop().toUpperCase()}\n**Analysis Type:** ${analysisType}\n\n**Analysis:**\n${analysisText}`; // eslint-disable-line max-len
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
            text: `Could not analyze video file: "${filePath}". The video may be corrupted, too long, or in an unsupported format.`,
          },
        ],
      };
    } catch (error) {
      log(`Error analyzing video: ${error.message}`, this.name);
      throw new Error(`Error analyzing video: ${error.message}`);
    }
  }
}

module.exports = VideoAnalysisTool;
