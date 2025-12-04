// File: src/components/EmptyState.tsx

/**
 * Empty state component
 * Provides a consistent UI for empty or zero-state scenarios
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Icon or illustration to display */
  icon?: ReactNode;
  /** Main title/heading */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button or link */
  action?: ReactNode;
  /** Custom className for the container */
  className?: string;
}

/**
 * EmptyState component
 * Displays a friendly message when there's no content to show
 *
 * @example
 * <EmptyState
 *   icon={<Music className="h-12 w-12" />}
 *   title="No favorites yet"
 *   description="Tracks you favorite will appear here"
 *   action={<Button>Browse Music</Button>}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-[var(--color-subtext)] opacity-50">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">
        {title}
      </h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-[var(--color-subtext)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
