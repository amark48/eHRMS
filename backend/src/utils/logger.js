// src/utils/logger.js
const debugEnabled = process.env.DEBUG === 'true';

/**
 * Logs debug messages only if DEBUG is enabled.
 * Accepts multiple arguments and passes them to console.log.
 */
const debugLog = (...args) => {
  if (debugEnabled) {
    console.log(...args);
  }
};

module.exports = { debugLog };