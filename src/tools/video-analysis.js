/**
 * Video Analysis Tool for Gemini MCP Server.
 * Analyzes video files using Gemini's multimodal video understanding capabilities.
 * Supports both direct file paths and pre-uploaded file URIs.
 *
 * @author Cline (updated by Rob)
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
            description: 'Path to the video file to analyze (supports MP4, MOV, AVI, WEBM, MKV, FLV) - for files under 100MB',
          },
          file_uri: {
            type: 'string',
            description: 'URI of pre-uploaded file (use gemini-upload-file first for files over 100MB)',
          },
          mime_type: {
            type: 'string',
            description: 'MIME type when using file_uri (e.g., "video/mp4")',
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
        required: [],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the video analysis tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} [args.file_path] - Path to the video file to analyze.
   * @param {string} [args.file_uri] - URI of pre-uploaded file (alternative to file_path).
   * @param {string} [args.mime_type] - MIME type when using file_uri.
   * @param {string} [args.analysis_type='summary'] - Type of analysis to perform.
   * @param {string} [args.context] - Optional context about the video content.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const analysisType = args.analysis_type ? validateString(args.analysis_type, 'analysis_type', ['summary', 'transcript', 'objects', 'detailed', 'custom']) : 'summary';
    const context = args.context ? validateString(args.context, 'context') : null;

    // Support both file path and file URI
    const fileUri = args.file_uri;
    const filePath = args.file_path;
    
    if (!fileUri && !filePath) {
      throw new Error('Either file_path or file_uri must be provided');
    }
    
    if (fileUri && filePath) {
      throw new Error('Please provide either file_path or file_uri, not both');
    }

    log(`Analyzing video ${fileUri ? 'from URI' : 'file'}: "${fileUri || filePath}" with analysis type: "${analysisType}" and context: ${context || 'general'}`, this.name);

    try {
      let analysisText;
      let videoSizeMB = 0;
      let mimeType;
      let fileName;
      
      // Prepare analysis prompt
      let baseAnalysisPrompt;
      switch (analysisType) {
        case 'summary':
          baseAnalysisPrompt = 'Please provide a comprehensive summary of this video. Describe what happens, who appears, key scenes, and the overall content.';
          break;
        case 'transcript':
          baseAnalysisPrompt = 'Please transcribe all spoken content in this video. Provide the complete text of dialogue, narration, and any other spoken words with timestamps if possible.';
          break;
        case 'objects':
          baseAnalysisPrompt = 'Please identify and describe all objects, people, locations, and visual elements visible in this video. List them systematically and note when they appear.';
          break;
        case 'detailed':
          baseAnalysisPrompt = 'Please provide a detailed analysis of this video including: summary of content, visual elements, audio/speech transcription, scene changes, key moments, and any notable details.';
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
      
      if (fileUri) {
        // Using pre-uploaded file URI
        mimeType = validateNonEmptyString(args.mime_type, 'mime_type');
        fileName = fileUri.split('/').pop();
        
        log(`Using pre-uploaded file URI: ${fileUri}, MIME type: ${mimeType}`, this.name);
        
        // Analyze using file URI
        analysisText = await this.geminiService.analyzeVideoFromUri('VIDEO_ANALYSIS', analysisPrompt, fileUri, mimeType);
        
      } else {
        // Traditional file path approach
        fileName = filePath;
        validateFileSize(filePath, config.MAX_VIDEO_SIZE_MB);
        const videoBuffer = readFileAsBuffer(filePath);
        videoSizeMB = videoBuffer.length / (1024 * 1024);
        const videoBase64 = videoBuffer.toString('base64');
        mimeType = getMimeType(filePath, config.SUPPORTED_VIDEO_MIMES);

        log(`Video file loaded: ${videoSizeMB.toFixed(2)}MB, MIME type: ${mimeType}`, this.name);
        
        // Analyze using base64 data
        analysisText = await this.geminiService.analyzeVideo('VIDEO_ANALYSIS', analysisPrompt, videoBase64, mimeType);
      }

      if (analysisText) {
        log('Video analysis completed successfully', this.name);

        if (this.intelligenceSystem.initialized) {
          try {
            const resultSummary = `Video analysis completed successfully: ${analysisText.length} characters, type: ${analysisType}`;
            await this.intelligenceSystem.learnFromInteraction(baseAnalysisPrompt, enhancedAnalysisPrompt, resultSummary, context, this.name);
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        let finalResponse = `✓ Video file analyzed successfully:\n\n**File:** ${fileName}\n`;
        
        if (fileUri) {
          finalResponse += `**Method:** File URI (pre-uploaded)\n**URI:** ${fileUri}\n`;
        } else {
          finalResponse += `**Method:** Direct upload\n**Size:** ${videoSizeMB.toFixed(2)}MB\n`;
          finalResponse += `**Format:** ${filePath.split('.').pop().toUpperCase()}\n`;
        }
        
        finalResponse += `**MIME Type:** ${mimeType}\n**Analysis Type:** ${analysisType}\n\n**Analysis:**\n${analysisText}`;
        
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
            text: `Could not analyze video file: "${fileName}". The video may be corrupted, too long, or in an unsupported format.`,
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
