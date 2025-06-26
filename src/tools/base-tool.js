/**
 * Abstract base class for all Gemini MCP tools.
 * Provides a common interface and properties for tools.
 *
 * @author Cline
 */

/**
 * @typedef {Object} ToolInputSchema
 * @property {string} type - The type of the schema (e.g., 'object').
 * @property {Object} properties - An object defining the properties of the input.
 * @property {string[]} required - An array of required property names.
 */

class BaseTool {
  /**
   * Constructs a BaseTool instance.
   * @param {string} name - The unique name of the tool.
   * @param {string} description - A brief description of what the tool does.
   * @param {ToolInputSchema} inputSchema - The JSON schema defining the tool's input parameters.
   * @param {import('../intelligence')} intelligenceSystem - The singleton instance of the IntelligenceSystem.
   * @param {import('../gemini/gemini-service')} geminiService - The singleton instance of the GeminiService.
   */
  constructor(name, description, inputSchema, intelligenceSystem, geminiService) {
    if (new.target === BaseTool) {
      throw new TypeError('Cannot construct BaseTool instances directly.');
    }

    if (!name || typeof name !== 'string') {
      throw new Error("Tool must have a valid 'name'.");
    }
    if (!description || typeof description !== 'string') {
      throw new Error("Tool must have a valid 'description'.");
    }
    if (!inputSchema || typeof inputSchema !== 'object') {
      throw new Error("Tool must have a valid 'inputSchema'.");
    }
    if (!intelligenceSystem) {
      throw new Error("Tool must be provided with an 'intelligenceSystem' instance.");
    }
    if (!geminiService) {
      throw new Error("Tool must be provided with a 'geminiService' instance.");
    }

    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    this.intelligenceSystem = intelligenceSystem;
    this.geminiService = geminiService;
  }

  /**
   * Executes the tool's functionality.
   * This method must be implemented by concrete tool classes.
   * @param {Object} args - The arguments for the tool, conforming to its inputSchema.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   * @throws {Error} If the method is not implemented by a subclass.
   */
  async execute(_args) { // eslint-disable-line no-unused-vars
    throw new Error(`Method 'execute(args)' must be implemented by ${this.constructor.name}.`);
  }

  /**
   * Returns the tool's metadata for MCP tools/list.
   * @returns {Object} The tool's name, description, and input schema.
   */
  getToolMetadata() {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
    };
  }
}

module.exports = BaseTool;
