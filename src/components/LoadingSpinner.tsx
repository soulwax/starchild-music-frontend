// File: src/components/LoadingSpinner.tsx

/**
 * Loading spinner component
 * Provides a consistent loading indicator across the app
 */

import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Custom className for additional styling */
  className?: string;
  /** Optional label for accessibility */
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
  xl: "h-16 w-16 border-4",
};

/**
 * LoadingSpinner component
 * Displays an animated spinner for loading states
 */
export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-t-transparent border-r-transparent border-b-[var(--color-accent)] border-l-transparent",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface LoadingStateProps {
  /** Custom message to display */
  message?: string;
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Custom className for the container */
  className?: string;
}

/**
 * LoadingState component
 * Displays a centered loading spinner with optional message
 * Use this for full-page or section loading states
 */
export function LoadingState({
  message = "Loading...",
  size = "md",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      <LoadingSpinner size={size} label={message} />
      {message && (
        <p className="mt-4 text-sm text-[var(--color-subtext)]">{message}</p>
      )}
    </div>
  );
}
