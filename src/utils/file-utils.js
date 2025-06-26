/**
 * Utility functions for file operations.
 *
 * @author Cline
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./logger');

/**
 * Ensures that a directory exists. If it doesn't, it creates it recursively.
 * @param {string} dirPath - The path to the directory.
 * @param {string} [moduleName='file-utils'] - The name of the module calling this function for logging.
 */
function ensureDirectoryExists(dirPath, moduleName = 'file-utils') {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, moduleName);
  }
}

/**
 * Reads a file and returns its content as a Buffer.
 * @param {string} filePath - The path to the file.
 * @returns {Buffer} The content of the file.
 * @throws {Error} If the file does not exist or cannot be read.
 */
function readFileAsBuffer(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath);
}

/**
 * Validates the size of a file against a maximum allowed size.
 * @param {string} filePath - The path to the file.
 * @param {number} maxSizeMB - The maximum allowed size in megabytes.
 * @throws {Error} If the file exceeds the maximum size.
 */
function validateFileSize(filePath, maxSizeMB) {
  const stats = fs.statSync(filePath);
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (stats.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSizeMB}MB, file is ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  }
}

/**
 * Determines the MIME type of a file based on its extension.
 * @param {string} filePath - The path to the file.
 * @param {Object.<string, string>} supportedMimes - An object mapping extensions to MIME types.
 * @returns {string} The determined MIME type.
 * @throws {Error} If the file extension is not supported.
 */
function getMimeType(filePath, supportedMimes) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = supportedMimes[extension];
  if (!mimeType) {
    throw new Error(`Unsupported file format: ${extension}. Supported formats: ${Object.keys(supportedMimes).map((ext) => ext.substring(1).toUpperCase()).join(', ')}`); // eslint-disable-line max-len
  }
  return mimeType;
}

module.exports = {
  ensureDirectoryExists,
  readFileAsBuffer,
  validateFileSize,
  getMimeType,
};
