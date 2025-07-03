/**
 * Utility functions for validating and ensuring proper storage configurations
 */

const fs = require('fs');
const path = require('path');
const validStorageTypes = ['json', 'memory'];

/**
 * Validates that the provided storageType is supported
 * @param {string} storageType - The storage type to validate (e.g., "json" or "memory")
 * @throws {Error} If the storage type is not supported
 */
function validateStorageType(storageType) {
  if (!validStorageTypes.includes(storageType)) {
    throw new Error(`Unsupported storage type: ${storageType}. Supported types: ${validStorageTypes.join(', ')}`);
  }
}

/**
 * Ensures that a storagePath value is provided and not empty/null
 * @param {string} storagePath - The storage path to validate
 * @param {string} storageType - The storage type being used
 * @throws {Error} If the storagePath is not provided for the specified storageType
 */
function ensureStoragePathProvided(storagePath, storageType) {
  if (storageType === 'json' && (!storagePath || storagePath.trim() === '')) {
    throw new Error(`A storage path must be provided for JSON storage`);
  }
}

/**
 * Validates that the required directory for the storage path exists
 * @param {string} storagePath - The storage path to validate
 * @throws {Error} If the directory doesn't exist
 */
function validateStoragePath(storagePath) {
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  }
}

module.exports = {
  validateStorageType,
  ensureStoragePathProvided,
  validateStoragePath,
};
