// File: src/components/Section.tsx

import type { ReactNode } from "react";
import SkeletonGrid from "./SkeletonGrid";

interface SectionProps<T> {
  title: string;
  loading: boolean;
  items: T[] | undefined;
  renderItem: (item: T, index: number) => ReactNode;
  gridColumns?: 1 | 2 | 3 | 4 | 6;
  skeletonCount?: number;
  skeletonHeight?: string;
  emptyIcon?: string;
  emptyMessage?: string;
  className?: string;
}

export default function Section<T>({
  title,
  loading,
  items,
  renderItem,
  gridColumns = 3,
  skeletonCount = 6,
  skeletonHeight = "h-24",
  emptyIcon = "🎵",
  emptyMessage = "No items yet",
  className = "",
}: SectionProps<T>) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <section className={`mb-12 ${className}`}>
      <h2 className="text-glow mb-6 text-2xl font-bold text-[var(--color-text)]">
        {title}
      </h2>
      {loading ? (
        <SkeletonGrid
          rows={skeletonCount}
          columns={gridColumns}
          itemHeight={skeletonHeight}
        />
      ) : items && items.length > 0 ? (
        <div className={`grid gap-4 ${gridCols[gridColumns]}`}>
          {items.map((item, idx) => renderItem(item, idx))}
        </div>
      ) : (
        <div className="surface-muted p-8 text-center">
          <div className="mb-2 text-4xl">{emptyIcon}</div>
          <p className="text-[var(--color-subtext)]">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}
