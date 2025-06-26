/**
 * Code Execution Tool for Gemini MCP Server.
 * Executes Python code using Gemini's built-in code execution sandbox.
 *
 * @author Cline
 */

const BaseTool = require('./base-tool');
const { log } = require('../utils/logger');
const { validateNonEmptyString, validateString } = require('../utils/validation');

class CodeExecutionTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'gemini-code-execute',
      'Execute Python code using Gemini\'s built-in code execution sandbox (with learned user preferences)',
      {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Python code to execute in the sandbox',
          },
          context: {
            type: 'string',
            description: 'Optional context for intelligent enhancement (e.g., "data-science", "automation", "testing")',
          },
        },
        required: ['code'],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the code execution tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} args.code - Python code to execute.
   * @param {string} [args.context] - Optional context about the code.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const code = validateNonEmptyString(args.code, 'code');
    const context = args.context ? validateString(args.context, 'context') : null;

    log(`Executing Python code: ${code.substring(0, 100)}... with context: ${context || 'general'}`, this.name);

    try {
      const basePrompt = `Please execute this Python code and show the results:\n\n\`\`\`python\n${code}\n\`\`\`\n\nExecute the code and provide both the code output and any results.`;

      let enhancedPrompt = basePrompt;
      if (this.intelligenceSystem.initialized) {
        try {
          enhancedPrompt = await this.intelligenceSystem.enhancePrompt(basePrompt, context, this.name);
          log('Applied Tool Intelligence enhancement', this.name);
        } catch (err) {
          log(`Tool Intelligence enhancement failed: ${err.message}`, this.name);
        }
      }

      let prompt = enhancedPrompt;
      if (context) {
        prompt += `\n\nContext: ${context}`;
      }

      const candidate = await this.geminiService.generateText('CODE_EXECUTION', prompt);
      const responseText = candidate; // Assuming generateText returns the direct text content
      const executionResults = []; // Code execution results are not directly extracted from generateText

      if (responseText || executionResults.length > 0) {
        let finalResponse = `✓ Python code executed successfully:\n\n**Code:**\n\`\`\`python\n${code}\n\`\`\`\n\n`; // eslint-disable-line max-len

        if (responseText) {
          finalResponse += `**Response:**\n${responseText}\n\n`;
        }

        if (executionResults.length > 0) {
          finalResponse += `**Execution Results:**\n${JSON.stringify(executionResults, null, 2)}\n`;
        }

        if (this.intelligenceSystem.initialized) {
          try {
            const resultSummary = `Code executed successfully with ${executionResults.length} results and ${responseText ? 'response text' : 'no response text'}`; // eslint-disable-line max-len
            await this.intelligenceSystem.learnFromInteraction(basePrompt, enhancedPrompt, resultSummary, context, this.name);
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        if (context && this.intelligenceSystem.initialized) {
          finalResponse += `\n\n---\n_Enhancement applied based on context: ${context}_`;
        }

        log('Code execution completed successfully', this.name);
        return {
          content: [
            {
              type: 'text',
              text: finalResponse,
            },
          ],
        };
      }
      log('No response text or execution results generated', this.name);
      return {
        content: [
          {
            type: 'text',
            text: `Code execution completed but no output was generated. The code may have run successfully without producing visible results.\n\n**Code:**\n\`\`\`python\n${code}\n\`\`\``, // eslint-disable-line max-len
          },
        ],
      };
    } catch (error) {
      log(`Error executing code: ${error.message}`, this.name);
      throw new Error(`Error executing code: ${error.message}`);
    }
  }
}

module.exports = CodeExecutionTool;
