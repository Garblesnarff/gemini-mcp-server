/**
 * Utility functions for input validation.
 *
 * @author Cline
 */

/**
 * Validates if a given value is a non-empty string.
 * @param {*} value - The value to validate.
 * @param {string} paramName - The name of the parameter being validated (for error messages).
 * @returns {string} The validated string.
 * @throws {Error} If the value is not a non-empty string.
 */
function validateNonEmptyString(value, paramName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid input: '${paramName}' must be a non-empty string.`);
  }
  return value;
}

/**
 * Validates if a given value is a string and optionally checks if it's one of the allowed values.
 * @param {*} value - The value to validate.
 * @param {string} paramName - The name of the parameter being validated.
 * @param {string[]} [allowedValues] - An optional array of allowed string values.
 * @returns {string} The validated string.
 * @throws {Error} If the value is not a string or not among allowed values.
 */
function validateString(value, paramName, allowedValues) {
  if (typeof value !== 'string') {
    throw new Error(`Invalid input: '${paramName}' must be a string.`);
  }
  if (allowedValues && !allowedValues.includes(value)) {
    throw new Error(`Invalid input: '${paramName}' must be one of [${allowedValues.join(', ')}], but received '${value}'.`); // eslint-disable-line max-len
  }
  return value;
}

/**
 * Validates if a given value is an object.
 * @param {*} value - The value to validate.
 * @param {string} paramName - The name of the parameter being validated.
 * @returns {Object} The validated object.
 * @throws {Error} If the value is not an object.
 */
function validateObject(value, paramName) {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Invalid input: '${paramName}' must be an object.`);
  }
  return value;
}

module.exports = {
  validateNonEmptyString,
  validateString,
  validateObject,
};
