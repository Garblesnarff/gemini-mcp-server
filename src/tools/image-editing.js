/**
 * Image Editing Tool for Gemini MCP Server.
 * Edits existing images using Gemini's AI image editing capabilities.
 *
 * @author Cline
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const BaseTool = require('./base-tool');
const { log } = require('../utils/logger');
const {
  ensureDirectoryExists, readFileAsBuffer, validateFileSize, getMimeType,
} = require('../utils/file-utils');
const { validateNonEmptyString, validateString } = require('../utils/validation');
const config = require('../config');

class ImageEditingTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'gemini-edit-image',
      'Edit existing images using Gemini\'s AI image editing capabilities (with learned user preferences)',
      {
        type: 'object',
        properties: {
          image_path: {
            type: 'string',
            description: 'Path to the image file to edit (JPEG, PNG, WebP, GIF, BMP)',
          },
          edit_instruction: {
            type: 'string',
            description: 'Detailed instruction for how to edit the image',
          },
          context: {
            type: 'string',
            description: 'Optional context for intelligent enhancement (e.g., "subtle", "dramatic", "professional")',
          },
        },
        required: ['image_path', 'edit_instruction'],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the image editing tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} args.image_path - Path to the image file to edit.
   * @param {string} args.edit_instruction - Detailed instruction for how to edit the image.
   * @param {string} [args.context] - Optional additional context about the desired edit.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const imagePath = validateNonEmptyString(args.image_path, 'image_path');
    const editInstruction = validateNonEmptyString(args.edit_instruction, 'edit_instruction');
    const context = args.context ? validateString(args.context, 'context') : null;

    log(`Editing image: "${imagePath}" with instruction: "${editInstruction}" and context: ${context || 'general'}`, this.name);

    try {
      validateFileSize(imagePath, config.MAX_IMAGE_SIZE_MB);
      const imageBuffer = readFileAsBuffer(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = getMimeType(imagePath, config.SUPPORTED_IMAGE_MIMES);

      log(`Image file loaded: ${(imageBuffer.length / 1024).toFixed(2)}KB, MIME type: ${mimeType}`, this.name);

      let enhancedEditInstruction = editInstruction;
      if (this.intelligenceSystem.initialized) {
        try {
          enhancedEditInstruction = await this.intelligenceSystem.enhancePrompt(editInstruction, context, this.name);
          log('Applied Tool Intelligence enhancement', this.name);
        } catch (err) {
          log(`Tool Intelligence enhancement failed: ${err.message}`, this.name);
        }
      }

      let editPrompt = `Please edit this image according to the following instruction: ${enhancedEditInstruction}`; // eslint-disable-line max-len
      if (context) {
        editPrompt += `\n\nAdditional context: ${context}`;
      }
      editPrompt += '\n\nProvide the edited image as output. Maintain the overall composition and quality while making the requested changes.'; // eslint-disable-line max-len

      const editedImageData = await this.geminiService.analyzeImage('IMAGE_EDITING', editPrompt, imageBase64, mimeType);

      if (editedImageData) {
        log('Successfully extracted edited image data', this.name);

        ensureDirectoryExists(config.OUTPUT_DIR, this.name);

        const timestamp = Date.now();
        const hash = crypto.createHash('md5').update(editInstruction).digest('hex');
        const imageName = `gemini-edited-${hash}-${timestamp}.png`;
        const outputImagePath = path.join(config.OUTPUT_DIR, imageName);

        fs.writeFileSync(outputImagePath, Buffer.from(editedImageData, 'base64'));
        log(`Edited image saved to: ${outputImagePath}`, this.name);

        if (this.intelligenceSystem.initialized) {
          try {
            await this.intelligenceSystem.learnFromInteraction(editInstruction, enhancedEditInstruction, `Image edited successfully: ${outputImagePath}`, context, this.name); // eslint-disable-line max-len
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        let finalResponse = `✓ Image successfully edited with instruction: "${editInstruction}"\n\n**Original:** ${imagePath}\n**Edited:** ${outputImagePath}\n\n**Edit Applied:** ${editInstruction}${context ? `\n**Context:** ${context}` : ''}`; // eslint-disable-line max-len
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
      log('No edited image data found in response', this.name);
      return {
        content: [
          {
            type: 'text',
            text: `Could not edit image with instruction: "${editInstruction}". No edited image data was returned by Gemini API. Try rephrasing your edit instruction or using a different image.`, // eslint-disable-line max-len
          },
        ],
      };
    } catch (error) {
      log(`Error editing image: ${error.message}`, this.name);
      throw new Error(`Error editing image: ${error.message}`);
    }
  }
}

module.exports = ImageEditingTool;
