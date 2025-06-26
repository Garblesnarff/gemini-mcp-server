# Contributing to Gemini MCP Server with Smart Tool Intelligence

Thank you for your interest in contributing to this cutting-edge project! This document outlines the guidelines and best practices for contributing to the Gemini MCP Server, which features a unique Smart Tool Intelligence system. By following these guidelines, you help ensure code quality, maintainability, and a smooth collaboration process.

## Table of Contents

1.  [Development Setup](#1-development-setup)
2.  [Project Structure](#2-project-structure)
3.  [Coding Standards](#3-coding-standards)
4.  [Smart Tool Intelligence Architecture](#4-smart-tool-intelligence-architecture)
5.  [Adding New Tools](#5-adding-new-tools)
6.  [Testing Procedures](#6-testing-procedures)
7.  [Deployment Instructions](#7-deployment-instructions)
8.  [Commit Guidelines](#8-commit-guidelines)
9.  [Pull Request Process](#9-pull-request-process)

---

## 1. Development Setup

To get started with development, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/gemini-mcp-server.git
    cd gemini-mcp-server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Gemini API Key:**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```
    *Note: Ensure your API key is kept secure and never committed to version control.*
4.  **Run the server:**
    ```bash
    node gemini-server.js
    ```
    The server communicates via `stdin`/`stdout`. You can test it using the provided `test-*.js` scripts or by integrating it with an MCP client.

## 2. Project Structure

The project follows a modular structure to ensure separation of concerns:

```
.
├── data/                     # Internal storage for preferences and learned patterns
├── scripts/                  # Utility scripts (e.g., clean-data, inspect-preferences)
├── src/
│   ├── config.js             # Application configuration
│   ├── server.js             # Main MCP server logic, request routing
│   ├── data/                 # Data persistence layer (preferences-manager, storage-adapter)
│   ├── gemini/               # Gemini API integration (client, models, request-handler, response-parser, gemini-service)
│   ├── intelligence/         # Smart Tool Intelligence system (context-detector, pattern-learner, prompt-enhancer, preference-store, index.js)
│   ├── tools/                # Individual tool implementations (base-tool, chat, image-generation, etc.)
│   └── utils/                # Common utility functions (logger, file-utils, validation)
├── tests/                    # Test files (if implemented)
├── .gitignore                # Git ignore file
├── package.json              # Project metadata and dependencies
├── README.md                 # Project overview and setup
└── CONTRIBUTING.md           # This document
```

## 3. Coding Standards

We adhere to strict coding standards to maintain a consistent and readable codebase.

*   **JavaScript Best Practices:**
    *   Use `const` and `let` instead of `var`.
    *   Prefer `async/await` for asynchronous operations.
    *   Implement proper error handling with `try...catch` blocks.
    *   Ensure input sanitization and validation where necessary.
*   **Naming Conventions:**
    *   Files: `kebab-case.js` (e.g., `image-generation.js`)
    *   Directories: `kebab-case` (e.g., `gemini-service`)
    *   Functions: `camelCase` (e.g., `dispatchToolCall`)
    *   Classes: `PascalCase` (e.g., `IntelligenceSystem`)
    *   Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_IMAGE_SIZE_MB`)
*   **Documentation:**
    *   All functions, classes, and complex logic **must** have JSDoc comments.
    *   Explain the "why" behind architectural decisions, not just the "what".
    *   Provide usage examples for complex functions or tools.
*   **File Size and Organization:**
    *   Aim to keep files under 200 lines of code. Refactor into smaller modules if necessary.
    *   Each file should ideally handle a single responsibility.
    *   Group related files into logical directories.
*   **Formatting:**
    *   Use 2 spaces for indentation.
    *   Add blank lines between logical sections of code.
    *   Maintain consistent brace style.

## 4. Smart Tool Intelligence Architecture

The Smart Tool Intelligence system is a core innovation of this project. It is designed as a singleton to ensure a single, consistent state across the application.

*   **`src/intelligence/index.js`**: This file exports the singleton instance of the `IntelligenceSystem`. It coordinates context detection, prompt enhancement, and pattern learning.
*   **`src/intelligence/context-detector.js`**: Responsible for analyzing user prompts and explicit context to determine the most relevant context key.
*   **`src/intelligence/prompt-enhancer.js`**: Uses learned patterns and context to modify or enhance user prompts before they are sent to the Gemini API.
*   **`src/intelligence/pattern-learner.js`**: Learns from successful interactions, storing patterns and preferences in the `PreferenceStore`.
*   **`src/intelligence/preference-store.js`**: Manages the persistence and retrieval of learned preferences (JSON-based internal storage).

**Interaction Flow:**

1.  A tool receives a user request.
2.  The tool calls `intelligenceSystem.enhancePrompt(originalPrompt, context, toolName)`.
3.  The `IntelligenceSystem` uses `ContextDetector` to determine the context and `PromptEnhancer` to modify the prompt based on learned preferences.
4.  After the tool successfully executes and gets a result from Gemini, it calls `intelligenceSystem.learnFromInteraction(originalPrompt, enhancedPrompt, result, context, toolName)`.
5.  The `PatternLearner` processes this interaction and updates the `PreferenceStore`.

## 5. Adding New Tools

To add a new AI-powered tool to the server:

1.  **Create a new file** in `src/tools/` (e.g., `new-tool.js`).
2.  **Extend `BaseTool`**: Your new tool class must extend `src/tools/base-tool.js`.
3.  **Implement `constructor`**:
    *   Call `super(name, description, inputSchema, intelligenceSystem, geminiService)`.
    *   Define the tool's `name`, `description`, and `inputSchema` (JSON schema for its arguments).
    *   Accept `intelligenceSystem` and `geminiService` as constructor arguments and pass them to `super()`.
4.  **Implement `execute` method**: This `async` method contains the core logic of your tool.
    *   It receives `args` (conforming to `inputSchema`).
    *   Use `this.intelligenceSystem` for prompt enhancement and learning.
    *   Use `this.geminiService` for all interactions with the Gemini API.
    *   Return the tool's result in a structured format.
5.  **Register the tool**: In `src/tools/index.js`, import your new tool and add it to the `registerTool` calls, passing the `intelligenceSystem` and `geminiService` instances.

## 6. Testing Procedures

*   **Unit Tests:** Write unit tests for individual functions and modules.
*   **Integration Tests:** Create integration tests to ensure tools interact correctly with the Gemini API and the Intelligence System.
*   **Example Usage Scripts:** For each tool, create a simple Node.js script in a `examples/` directory (to be created) that demonstrates how to use the tool. These scripts serve as functional tests and usage examples.

## 7. Deployment Instructions

(To be filled out later, once the core refactoring is complete and a deployment strategy is finalized.)

## 8. Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. This helps in generating changelogs and understanding the purpose of each commit.

*   **Format:** `<type>[optional scope]: <description>`
*   **Example:** `feat(chat): add context-aware prompt enhancement`
*   **Types:**
    *   `feat`: A new feature
    *   `fix`: A bug fix
    *   `docs`: Documentation only changes
    *   `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc.)
    *   `refactor`: A code change that neither fixes a bug nor adds a feature
    *   `perf`: A code change that improves performance
    *   `test`: Adding missing tests or correcting existing tests
    *   `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
    *   `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
    *   `chore`: Other changes that don't modify src or test files
    *   `revert`: Reverts a previous commit

## 9. Pull Request Process

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes, adhering to the coding standards.
4.  Write clear, concise commit messages.
5.  Push your branch (`git push origin feature/your-feature-name`).
6.  Open a pull request, describing your changes and linking to any relevant issues.
7.  Ensure all tests pass.
8.  Address any feedback from reviewers.

---

Thank you for contributing to the Gemini MCP Server! Your efforts help make this project a success.
