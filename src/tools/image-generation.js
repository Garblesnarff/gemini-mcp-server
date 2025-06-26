/**
 * Image Generation Tool for Gemini MCP Server.
 * Generates images using Google's Gemini 2.0 Flash Experimental model.
 *
 * @author Cline
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const BaseTool = require('./base-tool');
const { log } = require('../utils/logger');
const { ensureDirectoryExists } = require('../utils/file-utils');
const { validateNonEmptyString, validateString } = require('../utils/validation');
const config = require('../config');

class ImageGenerationTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'generate_image',
      'Generate an image using Google\'s Gemini 2.0 Flash Experimental model (with learned user preferences)',
      {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Text description of the desired image',
          },
          context: {
            type: 'string',
            description: 'Optional context for intelligent enhancement (e.g., "artistic", "photorealistic", "technical")',
          },
        },
        required: ['prompt'],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the image generation tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} args.prompt - The text description of the desired image.
   * @param {string} [args.context] - Optional context for intelligent enhancement.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const prompt = validateNonEmptyString(args.prompt, 'prompt');
    const context = args.context ? validateString(args.context, 'context') : null;
    log(`Generating image: "${prompt}" with context: ${context || 'general'}`, this.name);

    try {
      let enhancedPrompt = prompt;
      if (this.intelligenceSystem.initialized) {
        try {
          enhancedPrompt = await this.intelligenceSystem.enhancePrompt(prompt, context, this.name);
          log('Applied Tool Intelligence enhancement', this.name);
        } catch (err) {
          log(`Tool Intelligence enhancement failed: ${err.message}`, this.name);
        }
      }

      const formattedPrompt = `Create a detailed and high-quality image of: ${enhancedPrompt}`;
      const imageData = await this.geminiService.generateImage('IMAGE_GENERATION', formattedPrompt);

      if (imageData) {
        log('Successfully extracted image data', this.name);

        ensureDirectoryExists(config.OUTPUT_DIR, this.name);

        const timestamp = Date.now();
        const hash = crypto.createHash('md5').update(prompt).digest('hex');
        const imageName = `gemini-${hash}-${timestamp}.png`;
        const imagePath = path.join(config.OUTPUT_DIR, imageName);

        fs.writeFileSync(imagePath, Buffer.from(imageData, 'base64'));
        log(`Image saved to: ${imagePath}`, this.name);

        if (this.intelligenceSystem.initialized) {
          try {
            await this.intelligenceSystem.learnFromInteraction(prompt, enhancedPrompt, `Image generated successfully: ${imagePath}`, context, this.name);
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        let finalResponse = `✓ Image successfully generated from prompt: "${prompt}"\n\nYou can find the image at: ${imagePath}`; // eslint-disable-line max-len
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
      log('No image data found in response', this.name);
      return {
        content: [
          {
            type: 'text',
            text: `Could not generate image for: "${prompt}". No image data was returned by Gemini API.`,
          },
        ],
      };
    } catch (error) {
      log(`Error generating image: ${error.message}`, this.name);
      throw new Error(`Error generating image: ${error.message}`);
    }
  }
}

module.exports = ImageGenerationTool;
