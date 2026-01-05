// File: src/utils/logger.ts

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const getLogLevel = (): LogLevel => {
  if (typeof window === "undefined") {

    return process.env.NODE_ENV === "development" ? "DEBUG" : "WARN";
  } else {

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

const shouldLog = (level: LogLevel): boolean => {
  const levels: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR"];
  const currentLevelIndex = levels.indexOf(LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex >= currentLevelIndex;
};

export const logger = {

  debug: (...args: unknown[]): void => {
    if (shouldLog("DEBUG")) {
      console.debug(...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (shouldLog("INFO")) {
      console.log(...args);
    }
  },

  log: (...args: unknown[]): void => {
    if (shouldLog("INFO")) {
      console.log(...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (shouldLog("WARN")) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]): void => {
    if (shouldLog("ERROR")) {
      console.error(...args);
    }
  },

  table: (data: unknown): void => {
    if (shouldLog("DEBUG")) {
      console.table(data);
    }
  },

  group: (label: string, fn: () => void): void => {
    if (shouldLog("DEBUG")) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};

export const getActiveLogLevel = (): LogLevel => LOG_LEVEL;
