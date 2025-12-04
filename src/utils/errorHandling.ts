// File: src/utils/errorHandling.ts

/**
 * Error handling utilities
 * Provides consistent error handling and user-friendly error messages
 */

import type { ApiError } from "@/types";

/**
 * Error severity levels
 */
export type ErrorSeverity = "info" | "warning" | "error" | "critical";

/**
 * Structured error object
 */
export interface AppError {
  message: string;
  severity: ErrorSeverity;
  code?: string;
  details?: unknown;
  timestamp: Date;
}

/**
 * Convert various error types to a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  // Handle API errors
  if (isApiError(error)) {
    return error.message || "An error occurred";
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle tRPC errors
  if (isTRPCError(error)) {
    return error.message || "Server error occurred";
  }

  // Fallback
  return "An unexpected error occurred";
}

/**
 * Type guard for API errors
 */
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  );
}

/**
 * Type guard for tRPC errors
 */
function isTRPCError(
  error: unknown,
): error is { message: string; code?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: string }).message === "string"
  );
}

/**
 * Create a structured error object
 */
export function createError(
  error: unknown,
  severity: ErrorSeverity = "error",
  code?: string,
): AppError {
  return {
    message: getErrorMessage(error),
    severity,
    code,
    details: error,
    timestamp: new Date(),
  };
}

/**
 * Common error messages for specific scenarios
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Network connection failed. Please check your internet.",
  TIMEOUT: "Request timed out. Please try again.",
  SERVER_ERROR: "Server error occurred. Please try again later.",

  // Auth errors
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to perform this action.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",

  // Media errors
  MEDIA_LOAD_FAILED: "Failed to load audio. Please try again.",
  MEDIA_PLAYBACK_FAILED: "Playback failed. The track may be unavailable.",
  MEDIA_NOT_SUPPORTED: "This audio format is not supported.",

  // Data errors
  NOT_FOUND: "The requested item was not found.",
  INVALID_DATA: "Invalid data received. Please refresh and try again.",

  // Storage errors
  STORAGE_QUOTA_EXCEEDED: "Storage quota exceeded. Please clear some space.",
  STORAGE_UNAVAILABLE: "Local storage is unavailable.",

  // Generic errors
  UNKNOWN_ERROR: "An unexpected error occurred.",
  TRY_AGAIN: "Something went wrong. Please try again.",
} as const;

/**
 * Map media error codes to user-friendly messages
 */
export function getMediaErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "Playback was aborted";
    case MediaError.MEDIA_ERR_NETWORK:
      return ERROR_MESSAGES.NETWORK_ERROR;
    case MediaError.MEDIA_ERR_DECODE:
      return "Failed to decode audio";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return ERROR_MESSAGES.MEDIA_NOT_SUPPORTED;
    default:
      return ERROR_MESSAGES.MEDIA_PLAYBACK_FAILED;
  }
}

/**
 * Log error to console in development, could be extended to send to logging service
 */
export function logError(error: AppError): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${error.severity.toUpperCase()}] ${error.message}`, {
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
    });
  }

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // if (error.severity === 'critical' || error.severity === 'error') {
  //   sendToErrorTracking(error);
  // }
}

/**
 * Handle async errors with optional toast notification
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  {
    onError,
    errorMessage,
    showToast: _showToast = false,
  }: {
    onError?: (error: AppError) => void;
    errorMessage?: string;
    showToast?: boolean;
  } = {},
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    const appError = createError(
      error,
      "error",
      errorMessage ?? getErrorMessage(error),
    );

    logError(appError);

    if (onError) {
      onError(appError);
    }

    // TODO: Integrate with toast system if showToast is true
    // if (showToast) {
    //   showToastNotification(appError.message, 'error');
    // }

    return null;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  }: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
