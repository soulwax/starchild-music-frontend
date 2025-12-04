// File: src/components/SkeletonGrid.tsx

interface SkeletonGridProps {
  rows: number;
  columns?: 1 | 2 | 3 | 4 | 6;
  className?: string;
  itemHeight?: string;
}

export default function SkeletonGrid({
  rows,
  columns = 3,
  className = "",
  itemHeight = "h-24",
}: SkeletonGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${itemHeight} skeleton animate-pulse rounded-lg`}
        />
      ))}
    </div>
  );
}
