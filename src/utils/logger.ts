// File: src/utils/logger.ts

/**
 * Production-safe logger that only logs in development
 * Replaces console.log to prevent performance overhead in production
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * Log general information (development only)
   */
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  /**
   * Log informational messages (development only)
   */
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },

  /**
   * Display data in table format (development only)
   */
  table: (data: unknown) => {
    if (isDev) console.table(data);
  },

  /**
   * Group related log messages (development only)
   */
  group: (label: string, fn: () => void) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};
