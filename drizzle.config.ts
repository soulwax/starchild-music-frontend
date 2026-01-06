// File: drizzle.config.ts

import { config as dotenvConfig } from "dotenv";

// IMPORTANT: Load .env.local FIRST with override: true to ensure it takes precedence
// Then load .env as fallback. This ensures .env.local has priority.
dotenvConfig({ path: ".env.local", override: true });
dotenvConfig(); // Load .env as fallback

// Now import drizzle.env.ts after .env.local is loaded
import drizzleEnv from "./drizzle.env";

// Determine SSL configuration based on database type
function getSslConfig() {
  // Normalize DATABASE_URL to handle empty strings (empty strings should trigger fallback)
  const rawUrl = process.env.DATABASE_URL?.trim();
  const databaseUrl = rawUrl && rawUrl.length > 0 ? rawUrl : undefined;

  // For SSL detection, use DATABASE_URL if available, otherwise use host from legacy variables
  const connectionString = databaseUrl ?? (drizzleEnv.DB_HOST ?? "");

  // Check if it's a local database
  const isLocalDb = connectionString.includes("localhost") ||
                     connectionString.includes("127.0.0.1");

  if (isLocalDb) {
    console.log("[Drizzle] Local database detected. SSL disabled.");
    return undefined;
  }

  // Cloud database - use standard SSL with Node.js built-in CAs
  console.log("[Drizzle] Cloud database detected. Using standard SSL.");
  return {
    rejectUnauthorized: true,
  };
}

// Use DATABASE_URL if available, otherwise fall back to individual credentials
// for backward compatibility with drizzle.env.ts
// Normalize empty strings to undefined to match src/env.js behavior
const rawUrl = process.env.DATABASE_URL?.trim();
const databaseUrl = rawUrl && rawUrl.length > 0 ? rawUrl : undefined;

if (!databaseUrl && !process.env.DB_HOST) {
  console.warn(
    "[Drizzle] Warning: Neither DATABASE_URL nor DB_HOST is set. Database operations may fail."
  );
}

const config = {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql" as const,
  ...(databaseUrl
    ? {
        // Use connection string (Neon or other PostgreSQL)
        dbCredentials: {
          url: databaseUrl,
        },
      }
    : {
        // Fallback to individual credentials if DATABASE_URL is not set or empty
        dbCredentials: {
          host: drizzleEnv.DB_HOST ?? "localhost",
          port: parseInt(drizzleEnv.DB_PORT ?? "5432", 10),
          user: drizzleEnv.DB_ADMIN_USER,
          password: drizzleEnv.DB_ADMIN_PASSWORD,
          database: drizzleEnv.DB_NAME ?? "postgres",
          ssl: getSslConfig(),
        },
      }),
};

export default config;
