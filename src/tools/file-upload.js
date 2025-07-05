/**
 * File Upload Tool for Gemini MCP Server
 * Uploads files to Gemini File API for use in subsequent operations
 *
 * @author Rob (with Claude)
 */

const BaseTool = require('./base-tool');
const FileUploadService = require('../gemini/file-api/file-upload-service');
const { log } = require('../utils/logger');
const { validateNonEmptyString, validateString } = require('../utils/validation');
const config = require('../config');
const fs = require('fs');
const path = require('path');

class FileUploadTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'gemini-upload-file',
      'Upload files to Gemini File API (up to 2GB) for use in subsequent operations. Files persist for 48 hours.',
      {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to upload',
          },
          display_name: {
            type: 'string',
            description: 'Optional display name for the file (defaults to filename)',
          },
          operation: {
            type: 'string',
            description: 'Operation to perform: "upload", "list", "get", or "delete"',
            enum: ['upload', 'list', 'get', 'delete'],
          },
          file_name: {
            type: 'string',
            description: 'File name (for get/delete operations)',
          },
          page_size: {
            type: 'number',
            description: 'Number of files to list (for list operation, max 100)',
          },
        },
        required: ['operation'],
      },
      intelligenceSystem,
      geminiService,
    );
    
    this.fileUploadService = new FileUploadService(config.API_KEY);
  }

  /**
   * Executes the file upload tool.
   * @param {Object} args - The arguments for the tool.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const operation = validateString(args.operation, 'operation', ['upload', 'list', 'get', 'delete']);
    
    try {
      switch (operation) {
        case 'upload':
          return await this.handleUpload(args);
        case 'list':
          return await this.handleList(args);
        case 'get':
          return await this.handleGet(args);
        case 'delete':
          return await this.handleDelete(args);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      log(`Error in file upload tool: ${error.message}`, this.name);
      throw error;
    }
  }

  async handleUpload(args) {
    const filePath = validateNonEmptyString(args.file_path, 'file_path');
    const displayName = args.display_name || null;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Check file size
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 2048) { // 2GB limit
      throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 2GB.`);
    }
    
    log(`Uploading file: ${filePath} (${fileSizeMB.toFixed(2)}MB)`, this.name);
    
    try {
      const fileInfo = await this.fileUploadService.uploadFile(filePath, displayName);
      
      const response = `✓ File uploaded successfully to Gemini File API:\n\n` +
        `**Name:** ${fileInfo.display_name}\n` +
        `**URI:** ${fileInfo.uri}\n` +
        `**File ID:** ${fileInfo.name}\n` +
        `**Size:** ${(fileInfo.size_bytes / (1024 * 1024)).toFixed(2)}MB\n` +
        `**MIME Type:** ${fileInfo.mime_type}\n` +
        `**Created:** ${new Date(fileInfo.create_time).toLocaleString()}\n` +
        `**Expires:** ${new Date(fileInfo.expiration_time).toLocaleString()}\n\n` +
        `This file can now be used in other Gemini operations by referencing its URI.\n` +
        `The file will be automatically deleted after 48 hours.`;
      
      // Learn from the interaction if intelligence is enabled
      if (this.intelligenceSystem.initialized) {
        try {
          await this.intelligenceSystem.learnFromInteraction(
            `Upload file ${filePath}`,
            `Upload file ${filePath} with display name ${displayName || path.basename(filePath)}`,
            `Successfully uploaded ${fileSizeMB.toFixed(2)}MB file`,
            'file-upload',
            this.name
          );
        } catch (err) {
          log(`Tool Intelligence learning failed: ${err.message}`, this.name);
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async handleList(args) {
    const pageSize = args.page_size || 10;
    
    log(`Listing uploaded files (page size: ${pageSize})`, this.name);
    
    try {
      const response = await this.fileUploadService.listFiles(pageSize);
      
      if (!response.files || response.files.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No files currently uploaded to Gemini File API.',
            },
          ],
        };
      }
      
      let text = `✓ Found ${response.files.length} uploaded file(s):\n\n`;
      
      for (const file of response.files) {
        const sizeMB = (file.size_bytes / (1024 * 1024)).toFixed(2);
        const created = new Date(file.create_time).toLocaleString();
        const expires = new Date(file.expiration_time).toLocaleString();
        
        text += `**${file.display_name}**\n` +
          `- URI: ${file.uri}\n` +
          `- File ID: ${file.name}\n` +
          `- Size: ${sizeMB}MB\n` +
          `- Type: ${file.mime_type}\n` +
          `- Created: ${created}\n` +
          `- Expires: ${expires}\n\n`;
      }
      
      if (response.next_page_token) {
        text += `_More files available. Use page token to see next page._`;
      }
      
      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async handleGet(args) {
    const fileName = validateNonEmptyString(args.file_name, 'file_name');
    
    log(`Getting file info: ${fileName}`, this.name);
    
    try {
      const fileInfo = await this.fileUploadService.getFile(fileName);
      
      const sizeMB = (fileInfo.size_bytes / (1024 * 1024)).toFixed(2);
      const created = new Date(fileInfo.create_time).toLocaleString();
      const expires = new Date(fileInfo.expiration_time).toLocaleString();
      const state = fileInfo.state || 'ACTIVE';
      
      const response = `✓ File information:\n\n` +
        `**Display Name:** ${fileInfo.display_name}\n` +
        `**URI:** ${fileInfo.uri}\n` +
        `**File ID:** ${fileInfo.name}\n` +
        `**Size:** ${sizeMB}MB\n` +
        `**MIME Type:** ${fileInfo.mime_type}\n` +
        `**State:** ${state}\n` +
        `**Created:** ${created}\n` +
        `**Expires:** ${expires}\n` +
        `**SHA256:** ${fileInfo.sha256_hash || 'N/A'}`;
      
      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  async handleDelete(args) {
    const fileName = validateNonEmptyString(args.file_name, 'file_name');
    
    log(`Deleting file: ${fileName}`, this.name);
    
    try {
      await this.fileUploadService.deleteFile(fileName);
      
      return {
        content: [
          {
            type: 'text',
            text: `✓ File deleted successfully: ${fileName}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

module.exports = FileUploadTool;
