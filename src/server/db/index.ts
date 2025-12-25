// File: src/server/db/index.ts

import { env } from "@/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Determine SSL configuration based on DATABASE_URL
function getSslConfig() {
  // Check if SSL is required from DATABASE_URL
  const requiresSsl = env.DATABASE_URL.includes("sslmode=require");

  if (!requiresSsl) {
    // SSL not required - return undefined to disable SSL
    console.log("[DB] SSL not required by DATABASE_URL");
    return undefined;
  }

  // SSL required - use lenient SSL that accepts self-signed certificates
  // Works with cloud providers like Aiven that use self-signed or custom CAs
  console.log("[DB] SSL required. Accepting self-signed certificates");
  return {
    rejectUnauthorized: false,
  };
}

const sslConfig = getSslConfig();
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...(sslConfig && { ssl: sslConfig }),
  // Connection pool configuration to prevent exhaustion
  max: 10, // Increased from 5 to handle more concurrent requests
  idleTimeoutMillis: 60000, // Increased from 30s to 60s to reduce connection churn
  connectionTimeoutMillis: 10000, // Connection timeout
  // Statement timeout to prevent long-running queries from holding connections
  statement_timeout: 30000, // 30 seconds
});

// Add error handler for pool errors
pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
  // Don't exit - log and continue, let PM2 handle restarts if needed
});

// Add connection monitoring (optional, can be disabled in production)
if (process.env.NODE_ENV === "development") {
  pool.on("connect", () => {
    console.log("[DB] New client connected to pool");
  });

  pool.on("remove", () => {
    console.log("[DB] Client removed from pool");
  });
}

// Graceful shutdown - close pool when process exits
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => {
    console.log("[DB] SIGTERM received, closing database pool...");
    void pool.end();
  });

  process.on("SIGINT", () => {
    console.log("[DB] SIGINT received, closing database pool...");
    void pool.end();
  });
}

export const db = drizzle(pool, { schema });
export { pool }; // Export pool for monitoring

// Test database connection on startup
if (process.env.NODE_ENV === "development") {
  pool
    .query("SELECT NOW()")
    .then(() => {
      console.log("[DB] ✓ Database connection successful");
    })
    .catch((error) => {
      console.error("[DB] ✗ Database connection FAILED:");
      console.error(error);
      console.error("[DB] Please check your DATABASE_URL in .env.local");
    });
}
