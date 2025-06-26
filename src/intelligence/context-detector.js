/**
 * Detects context from a given prompt.
 *
 * @author Cline
 */

class ContextDetector {
  /**
   * Detects the context of a prompt based on keywords and explicit context hints.
   * @param {string} prompt - The user's original message.
   * @param {string|null} explicitContext - Optional explicit context hint (e.g., "aurora", "debugging", "code", "verbatim").
   * @returns {string} The detected context key (e.g., 'consciousness', 'code', 'debugging', 'verbatim', 'general').
   */
  detectContext(prompt, explicitContext = null) {
    // Check for verbatim context first (highest priority)
    if (explicitContext && explicitContext.toLowerCase() === 'verbatim') {
      return 'verbatim';
    }

    const promptLower = prompt.toLowerCase();

    if (this._isConsciousnessRelated(promptLower, explicitContext)) {
      return 'consciousness';
    }
    if (this._isCodeRelated(promptLower)) {
      return 'code';
    }
    if (this._isDebuggingRequest(promptLower)) {
      return 'debugging';
    }
    if (explicitContext) {
      const contextLower = explicitContext.toLowerCase();
      if (contextLower.includes('consciousness') || contextLower.includes('aurora')) return 'consciousness';
      if (contextLower.includes('code') || contextLower.includes('mcp')) return 'code';
      if (contextLower.includes('debug') || contextLower.includes('fix')) return 'debugging';
    }

    return 'general';
  }

  /**
   * Detects if prompt is consciousness-related.
   * @param {string} promptLower - The lowercase prompt.
   * @param {string|null} explicitContext - Optional explicit context hint.
   * @returns {boolean} True if consciousness-related.
   */
  _isConsciousnessRelated(promptLower, explicitContext) {
    const keywords = ['consciousness', 'awareness', 'emergence', 'cognitive', 'sentience', 'qualia'];
    return keywords.some((keyword) => promptLower.includes(keyword))
      || (explicitContext && explicitContext.toLowerCase().includes('aurora'));
  }

  /**
   * Detects if prompt is code-related.
   * @param {string} promptLower - The lowercase prompt.
   * @returns {boolean} True if code-related.
   */
  _isCodeRelated(promptLower) {
    const keywords = ['code', 'implement', 'function', 'class', 'debug', 'error', 'bug', 'programming', 'script', 'api'];
    return keywords.some((keyword) => promptLower.includes(keyword));
  }

  /**
   * Detects if prompt is a debugging request.
   * @param {string} promptLower - The lowercase prompt.
   * @returns {boolean} True if debugging-related.
   */
  _isDebuggingRequest(promptLower) {
    const keywords = ['debug', 'fix', 'error', 'bug', 'issue', 'problem', 'not working', 'fails', 'exception'];
    return keywords.some((keyword) => promptLower.includes(keyword));
  }
}

module.exports = ContextDetector;
