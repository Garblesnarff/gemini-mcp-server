/**
 * Chat Tool for Gemini MCP Server.
 * Chats with Gemini AI for conversations and assistance, integrated with Smart Tool Intelligence.
 *
 * @author Cline
 */

const BaseTool = require('./base-tool');
const { log } = require('../utils/logger');
const { validateNonEmptyString, validateString } = require('../utils/validation');

class ChatTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'gemini-chat',
      'Chat with Gemini AI for conversations, questions, and general assistance (with learned user preferences)',
      {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Your message or question to chat with Gemini AI',
          },
          context: {
            type: 'string',
            description: 'Optional additional context for the conversation (e.g., "aurora", "debugging", "code")',
          },
        },
        required: ['message'],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the chat tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} args.message - The user's message or question.
   * @param {string} [args.context] - Optional additional context for the conversation.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const message = validateNonEmptyString(args.message, 'message');
    const context = args.context ? validateString(args.context, 'context') : null;

    log(`Processing chat message: "${message}" with context: ${context || 'general'}`, this.name);

    try {
      let enhancedMessage = message;
      if (this.intelligenceSystem.initialized) {
        try {
          enhancedMessage = await this.intelligenceSystem.enhancePrompt(message, context);
          log('Applied Tool Intelligence enhancement', this.name);
        } catch (err) {
          log(`Tool Intelligence enhancement failed: ${err.message}`, this.name);
        }
      }

      const responseText = await this.geminiService.generateText('CHAT', enhancedMessage);

      if (responseText) {
        if (this.intelligenceSystem.initialized) {
          try {
            await this.intelligenceSystem.learnFromInteraction(message, enhancedMessage, responseText, context, this.name);
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        log('Chat response completed successfully', this.name);

        let finalResponse = responseText;
        if (context && this.intelligenceSystem.initialized) {
          finalResponse += `\n\n---\n_Enhancement applied based on context: ${context}_`; // eslint-disable-line max-len
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
      log('No response text generated', this.name);
      return {
        content: [
          {
            type: 'text',
            text: `I couldn't generate a response to: "${message}". Please try rephrasing your message.`,
          },
        ],
      };
    } catch (error) {
      log(`Error processing chat: ${error.message}`, this.name);
      throw new Error(`Error processing chat: ${error.message}`);
    }
  }
}

module.exports = ChatTool;
