// File: src/components/EmptyState.tsx

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EmptyStateProps {

  icon?: ReactNode;

  title: string;

  description?: string;

  action?: ReactNode;

  className?: string;
}

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
