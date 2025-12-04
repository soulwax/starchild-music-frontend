// File: src/components/ErrorBoundary.tsx

"use client";

/**
 * Error Boundary component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */

import { Component, type ReactNode } from "react";

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback component */
  fallback?: ReactNode;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component
 * Provides error handling for React component tree
 *
 * @example
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold text-[var(--color-text)]">
              Oops! Something went wrong
            </h1>
            <p className="mb-6 text-[var(--color-subtext)]">
              We&apos;re sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-white transition-colors hover:opacity-90"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-[var(--color-subtext)]">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-black/20 p-4 text-xs">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-6xl">⚠️</div>
      <h2 className="mb-2 text-xl font-semibold text-[var(--color-text)]">
        Something went wrong
      </h2>
      <p className="mb-6 text-sm text-[var(--color-subtext)]">
        We encountered an unexpected error. Please try again.
      </p>
      {resetError && (
        <button
          onClick={resetError}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm text-white transition-colors hover:opacity-90"
        >
          Try Again
        </button>
      )}
      {process.env.NODE_ENV === "development" && error && (
        <pre className="mt-4 max-w-full overflow-auto rounded bg-black/20 p-4 text-left text-xs">
          {error.message}
        </pre>
      )}
    </div>
  );
}
