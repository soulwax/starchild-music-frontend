// File: src/utils/logger.ts

/**
 * Centralized logging utility with environment-based log levels.
 *
 * Log Levels (in order of severity):
 * - DEBUG: Detailed information for diagnosing issues (dev only)
 * - INFO: General informational messages (dev only)
 * - WARN: Warning messages that don't prevent operation (always shown)
 * - ERROR: Error messages for failures (always shown)
 *
 * Environment Behavior:
 * - Development (NODE_ENV=development): Shows all levels (DEBUG, INFO, WARN, ERROR)
 * - Production (NODE_ENV=production): Shows only WARN and ERROR
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

// Determine log level based on environment
const getLogLevel = (): LogLevel => {
  if (typeof window === "undefined") {
    // Server-side: use NODE_ENV
    return process.env.NODE_ENV === "development" ? "DEBUG" : "WARN";
  } else {
    // Client-side: use NEXT_PUBLIC_LOG_LEVEL or fallback to NODE_ENV
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
    if (
      envLevel === "DEBUG" ||
      envLevel === "INFO" ||
      envLevel === "WARN" ||
      envLevel === "ERROR"
    ) {
      return envLevel;
    }
    return process.env.NODE_ENV === "development" ? "DEBUG" : "WARN";
  }
};

const LOG_LEVEL = getLogLevel();

// Helper to check if a given level should be logged
const shouldLog = (level: LogLevel): boolean => {
  const levels: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR"];
  const currentLevelIndex = levels.indexOf(LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex >= currentLevelIndex;
};

/**
 * Logger utility with methods for each log level.
 * All methods accept the same arguments as console methods.
 */
export const logger = {
  /**
   * Debug-level logging - only shown in development
   * Use for: Verbose operational details, state changes, flow tracking
   */
  debug: (...args: unknown[]): void => {
    if (shouldLog("DEBUG")) {
      console.debug(...args);
    }
  },

  /**
   * Info-level logging - only shown in development
   * Use for: General informational messages, successful operations
   */
  info: (...args: unknown[]): void => {
    if (shouldLog("INFO")) {
      console.log(...args);
    }
  },

  /**
   * Log alias for info (backwards compatibility)
   */
  log: (...args: unknown[]): void => {
    if (shouldLog("INFO")) {
      console.log(...args);
    }
  },

  /**
   * Warning-level logging - always shown (even in production)
   * Use for: Recoverable issues, deprecated usage, fallback behavior
   */
  warn: (...args: unknown[]): void => {
    if (shouldLog("WARN")) {
      console.warn(...args);
    }
  },

  /**
   * Error-level logging - always shown (even in production)
   * Use for: Failures, exceptions, critical issues
   */
  error: (...args: unknown[]): void => {
    if (shouldLog("ERROR")) {
      console.error(...args);
    }
  },

  /**
   * Display data in table format (development only)
   */
  table: (data: unknown): void => {
    if (shouldLog("DEBUG")) {
      console.table(data);
    }
  },

  /**
   * Group related log messages (development only)
   */
  group: (label: string, fn: () => void): void => {
    if (shouldLog("DEBUG")) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};

/**
 * Get the current log level (useful for debugging)
 */
export const getActiveLogLevel = (): LogLevel => LOG_LEVEL;
