// File: drizzle.config.ts

import "dotenv/config";
import { config as dotenvConfig } from "dotenv";

// IMPORTANT: Load .env.local BEFORE importing drizzle.env.ts
// This ensures DATABASE_URL from .env.local is available when drizzle.env.ts evaluates
dotenvConfig({ path: ".env.local" });

// Now import drizzle.env.ts after .env.local is loaded
import drizzleEnv from "./drizzle.env";

// Use DATABASE_URL if available, otherwise fall back to individual credentials
// for backward compatibility with drizzle.env.ts
const databaseUrl = process.env.DATABASE_URL;

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
        // Fallback to individual credentials if DATABASE_URL is not set
        dbCredentials: {
          host: drizzleEnv.DB_HOST ?? "localhost",
          port: parseInt(drizzleEnv.DB_PORT ?? "5432", 10),
          user: drizzleEnv.DB_ADMIN_USER,
          password: drizzleEnv.DB_ADMIN_PASSWORD,
          database: drizzleEnv.DB_NAME ?? "postgres",
        },
      }),
};

export default config;
