/**
 * Storage Adapter for abstracting storage mechanisms.
 * Currently supports JSON file storage, but can be extended for
 * SQLite, in-memory storage, or other backends.
 *
 * @author Assistant
 */

const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');

const { validateStorageType, ensureStoragePathProvided, validateStoragePath } = require('../utils/storage-validation');

class StorageAdapter {
  constructor(storageType = 'json', storagePath = null) {
    // Validate and ensure storage type and path are provided
    validateStorageType(storageType);
    ensureStoragePathProvided(storagePath, storageType);
    validateStoragePath(storagePath);

    this.type = storageType;
    this.storagePath = storagePath;

    // Initialize memory storage if needed
    if (this.type === 'memory') {
      this.memoryStore = new Map();
    }
  }

  /**
   * Reads data for a given key.
   * @param {string} key - The key to read
   * @returns {Promise<any>} The data associated with the key
   */
  async read(key) {
    switch (this.type) {
      case 'json':
        return this._readJson(key);
      case 'memory':
        return this._readMemory(key);
      default:
        throw new Error(`Read not implemented for storage type: ${this.type}`);
    }
  }

  /**
   * Writes data for a given key.
   * @param {string} key - The key to write
   * @param {any} data - The data to write
   */
  async write(key, data) {
    switch (this.type) {
      case 'json':
        return this._writeJson(key, data);
      case 'memory':
        return this._writeMemory(key, data);
      default:
        throw new Error(`Write not implemented for storage type: ${this.type}`);
    }
  }

  /**
   * Checks if a key exists in storage.
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} True if the key exists
   */
  async exists(key) {
    switch (this.type) {
      case 'json':
        return this._existsJson(key);
      case 'memory':
        return this._existsMemory(key);
      default:
        throw new Error(`Exists not implemented for storage type: ${this.type}`);
    }
  }

  /**
   * Deletes data for a given key.
   * @param {string} key - The key to delete
   */
  async delete(key) {
    switch (this.type) {
      case 'json':
        return this._deleteJson(key);
      case 'memory':
        return this._deleteMemory(key);
      default:
        throw new Error(`Delete not implemented for storage type: ${this.type}`);
    }
  }

  // JSON Storage Implementation
  _readJson(key) {
    try {
      if (!this.storagePath) {
        throw new Error('Storage path not provided for JSON storage');
      }

      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const parsed = JSON.parse(data);
        return parsed[key] || parsed;
      }

      return null;
    } catch (error) {
      log(`Error reading JSON data for key ${key}: ${error.message}`, 'storage-adapter');
      throw error;
    }
  }

  _writeJson(key, data) {
    try {
      if (!this.storagePath) {
        throw new Error('Storage path not provided for JSON storage');
      }

      // For simple storage, we treat the entire file as the data
      // In a more complex implementation, we might store multiple keys
      const dataToWrite = key === 'preferences' ? data : { [key]: data };

      // Ensure directory exists
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.storagePath, JSON.stringify(dataToWrite, null, 2));
      log(`Data written to JSON storage for key: ${key}`, 'storage-adapter');
    } catch (error) {
      log(`Error writing JSON data for key ${key}: ${error.message}`, 'storage-adapter');
      throw error;
    }
  }

  _existsJson(key) {
    try {
      if (!this.storagePath || !fs.existsSync(this.storagePath)) {
        return false;
      }

      const data = fs.readFileSync(this.storagePath, 'utf8');
      const parsed = JSON.parse(data);

      // For preferences, we check if the file exists and has content
      if (key === 'preferences') {
        return parsed && Object.keys(parsed).length > 0;
      }

      return Object.prototype.hasOwnProperty.call(parsed, key);
    } catch (error) {
      log(`Error checking existence for key ${key}: ${error.message}`, 'storage-adapter');
      return false;
    }
  }

  _deleteJson(key) {
    try {
      if (!this.storagePath || !fs.existsSync(this.storagePath)) {
        return;
      }

      if (key === 'preferences') {
        // Delete the entire file for preferences
        fs.unlinkSync(this.storagePath);
      } else {
        // For other keys, remove from the JSON object
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const parsed = JSON.parse(data);
        delete parsed[key];
        fs.writeFileSync(this.storagePath, JSON.stringify(parsed, null, 2));
      }

      log(`Data deleted from JSON storage for key: ${key}`, 'storage-adapter');
    } catch (error) {
      log(`Error deleting JSON data for key ${key}: ${error.message}`, 'storage-adapter');
      throw error;
    }
  }

  // Memory Storage Implementation
  _readMemory(key) {
    return this.memoryStore.get(key) || null;
  }

  _writeMemory(key, data) {
    this.memoryStore.set(key, data);
    log(`Data written to memory storage for key: ${key}`, 'storage-adapter');
  }

  _existsMemory(key) {
    return this.memoryStore.has(key);
  }

  _deleteMemory(key) {
    this.memoryStore.delete(key);
    log(`Data deleted from memory storage for key: ${key}`, 'storage-adapter');
  }

  /**
   * Gets storage statistics (useful for monitoring).
   * @returns {Object} Storage statistics
   */
  async getStats() {
    switch (this.type) {
      case 'json':
        if (this.storagePath && fs.existsSync(this.storagePath)) {
          const stats = fs.statSync(this.storagePath);
          return {
            type: this.type,
            path: this.storagePath,
            size: stats.size,
            modified: stats.mtime,
          };
        }
        return { type: this.type, path: this.storagePath, exists: false };

      case 'memory':
        return {
          type: this.type,
          entries: this.memoryStore.size,
          keys: Array.from(this.memoryStore.keys()),
        };

      default:
        return { type: this.type };
    }
  }
}

module.exports = StorageAdapter;
