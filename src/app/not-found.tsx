// File: src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-[var(--color-text)]">
          404
        </h1>
        <p className="mb-6 text-lg text-[var(--color-subtext)]">
          Page not found
        </p>
        <Link
          href="/"
          className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-white transition-colors hover:opacity-90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
