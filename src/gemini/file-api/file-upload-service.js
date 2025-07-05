/**
 * Gemini File API Upload Service
 * Implements resumable upload protocol for files up to 2GB
 * 
 * @author Rob (with Claude)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { log } = require('../../utils/logger');

class FileUploadService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com';
  }

  /**
   * Uploads a file to Gemini using resumable upload protocol
   * @param {string} filePath - Path to the file to upload
   * @param {string} displayName - Display name for the file
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} File metadata including URI
   */
  async uploadFile(filePath, displayName = null, options = {}) {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const mimeType = this.getMimeType(filePath);
    
    if (!displayName) {
      displayName = path.basename(filePath);
    }

    log(`Starting resumable upload for file: ${filePath} (${(fileSize / (1024 * 1024)).toFixed(2)}MB)`, 'file-upload');

    // Step 1: Initialize resumable upload
    const uploadUrl = await this.initializeResumableUpload(displayName, mimeType, fileSize);
    
    // Step 2: Upload the file data
    const fileInfo = await this.uploadFileData(uploadUrl, filePath, fileSize);
    
    log(`File uploaded successfully: ${fileInfo.name}, URI: ${fileInfo.uri}`, 'file-upload');
    return fileInfo;
  }

  /**
   * Initialize resumable upload and get upload URL
   */
  async initializeResumableUpload(displayName, mimeType, fileSize) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/upload/v1beta/files?uploadType=resumable&key=${this.apiKey}`);
      
      const metadata = {
        file: {
          display_name: displayName
        }
      };

      const options = {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(metadata))
        }
      };

      const req = https.request(url.toString(), options, (res) => {
        let uploadUrl = res.headers['x-goog-upload-url'];
        
        if (!uploadUrl) {
          reject(new Error('No upload URL received from server'));
          return;
        }

        log(`Received upload URL: ${uploadUrl.substring(0, 50)}...`, 'file-upload');
        resolve(uploadUrl);
      });

      req.on('error', (err) => {
        reject(new Error(`Failed to initialize upload: ${err.message}`));
      });

      req.write(JSON.stringify(metadata));
      req.end();
    });
  }

  /**
   * Upload file data to the resumable upload URL
   */
  async uploadFileData(uploadUrl, filePath, fileSize) {
    return new Promise((resolve, reject) => {
      const url = new URL(uploadUrl);
      
      const options = {
        method: 'PUT',
        headers: {
          'Content-Length': fileSize.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize'
        }
      };

      const req = https.request(url.toString(), options, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            log(`Upload response: ${data}`, 'file-upload');
            const response = JSON.parse(data);
            
            // The API returns the file object directly, not wrapped
            const fileInfo = response.file || response;
            
            // Ensure we have the required fields with defaults
            const normalizedFileInfo = {
              name: fileInfo.name || 'unknown',
              uri: fileInfo.uri || '',
              display_name: fileInfo.displayName || fileInfo.display_name || path.basename(filePath),
              mime_type: fileInfo.mimeType || fileInfo.mime_type || this.getMimeType(filePath),
              size_bytes: fileInfo.sizeBytes || fileInfo.size_bytes || fileSize,
              create_time: fileInfo.createTime || fileInfo.create_time || new Date().toISOString(),
              expiration_time: fileInfo.expirationTime || fileInfo.expiration_time || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              state: fileInfo.state || 'ACTIVE'
            };
            
            resolve(normalizedFileInfo);
          } catch (err) {
            log(`Failed to parse upload response: ${data}`, 'file-upload');
            reject(new Error(`Failed to parse upload response: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Failed to upload file data: ${err.message}`));
      });

      // Stream the file to the upload endpoint
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(req);
      
      fileStream.on('error', (err) => {
        reject(new Error(`Failed to read file: ${err.message}`));
      });
    });
  }

  /**
   * Get file metadata
   */
  async getFile(fileName) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/v1beta/${fileName}?key=${this.apiKey}`);
      
      https.get(url.toString(), (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            log(`Get file response: ${data}`, 'file-upload');
            const response = JSON.parse(data);
            
            // Normalize the file info
            const fileInfo = response.file || response;
            const normalizedFileInfo = {
              name: fileInfo.name || fileName,
              uri: fileInfo.uri || '',
              display_name: fileInfo.displayName || fileInfo.display_name || fileInfo.name,
              mime_type: fileInfo.mimeType || fileInfo.mime_type || 'unknown',
              size_bytes: fileInfo.sizeBytes || fileInfo.size_bytes || 0,
              create_time: fileInfo.createTime || fileInfo.create_time || new Date().toISOString(),
              expiration_time: fileInfo.expirationTime || fileInfo.expiration_time || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              state: fileInfo.state || 'ACTIVE',
              sha256_hash: fileInfo.sha256Hash || fileInfo.sha256_hash || 'N/A'
            };
            
            resolve(normalizedFileInfo);
          } catch (err) {
            log(`Failed to parse file info: ${data}`, 'file-upload');
            reject(new Error(`Failed to parse file info: ${err.message}`));
          }
        });
      }).on('error', (err) => {
        reject(new Error(`Failed to get file info: ${err.message}`));
      });
    });
  }

  /**
   * List uploaded files
   */
  async listFiles(pageSize = 10, pageToken = null) {
    return new Promise((resolve, reject) => {
      let url = `${this.baseUrl}/v1beta/files?key=${this.apiKey}&pageSize=${pageSize}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            log(`List files response: ${data.substring(0, 500)}...`, 'file-upload');
            const response = JSON.parse(data);
            
            // Normalize the response
            const normalizedResponse = {
              files: [],
              next_page_token: response.nextPageToken || response.next_page_token
            };
            
            if (response.files && Array.isArray(response.files)) {
              normalizedResponse.files = response.files.map(file => ({
                name: file.name || 'unknown',
                uri: file.uri || '',
                display_name: file.displayName || file.display_name || file.name,
                mime_type: file.mimeType || file.mime_type || 'unknown',
                size_bytes: file.sizeBytes || file.size_bytes || 0,
                create_time: file.createTime || file.create_time || new Date().toISOString(),
                expiration_time: file.expirationTime || file.expiration_time || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                state: file.state || 'ACTIVE'
              }));
            }
            
            resolve(normalizedResponse);
          } catch (err) {
            log(`Failed to parse list response: ${data}`, 'file-upload');
            reject(new Error(`Failed to parse list response: ${err.message}`));
          }
        });
      }).on('error', (err) => {
        reject(new Error(`Failed to list files: ${err.message}`));
      });
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(fileName) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/v1beta/${fileName}?key=${this.apiKey}`);
      
      const options = {
        method: 'DELETE'
      };

      const req = https.request(url.toString(), options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve({ success: true });
        } else {
          reject(new Error(`Failed to delete file: ${res.statusCode}`));
        }
      });

      req.on('error', (err) => {
        reject(new Error(`Failed to delete file: ${err.message}`));
      });

      req.end();
    });
  }

  /**
   * Determine MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.mpeg': 'video/mpeg',
      '.mov': 'video/mov',
      '.avi': 'video/avi',
      '.flv': 'video/x-flv',
      '.mpg': 'video/mpg',
      '.webm': 'video/webm',
      '.wmv': 'video/x-ms-wmv',
      '.3gpp': 'video/3gpp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.json': 'application/json'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = FileUploadService;
