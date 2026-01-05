// File: src/components/LoadingSpinner.tsx

import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {

  size?: "sm" | "md" | "lg" | "xl";

  className?: string;

  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
  xl: "h-16 w-16 border-4",
};

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

  message?: string;

  size?: "sm" | "md" | "lg" | "xl";

  className?: string;
}

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
