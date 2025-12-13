// Stub file for Next.js build compatibility
// This file exists to prevent build errors in App Router projects
// where Next.js still looks for Pages Router files during build

import { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

export default function Error({ statusCode }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-[var(--color-text)]">
          {statusCode || "Error"}
        </h1>
        <p className="mb-6 text-lg text-[var(--color-subtext)]">
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : "An error occurred on client"}
        </p>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

