// File: src/server/db/index.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";
import { env } from "@/env";
import * as schema from "./schema";

// Determine certificate path based on environment
function getCertPath(): string | null {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), "certs/ca.pem"), // Development
    path.join(__dirname, "../../certs/ca.pem"), // Relative to build output
    path.join(__dirname, "../../../certs/ca.pem"), // Another build variant
  ];

  for (const certPath of possiblePaths) {
    if (existsSync(certPath)) {
      console.log(`[DB] Using certificate from: ${certPath}`);
      return certPath;
    }
  }

  return null;
}

// Determine SSL configuration based on certificate availability
function getSslConfig() {
  const certPath = getCertPath();
  
  if (certPath) {
    // Certificate found - use it with strict validation
    return {
      rejectUnauthorized: true,
      ca: readFileSync(certPath).toString(),
    };
  }
  
  // Certificate not found - check if SSL is required from DATABASE_URL
  const requiresSsl = env.DATABASE_URL.includes("sslmode=require");
  
  if (requiresSsl) {
    // SSL required but no certificate - use lenient SSL (for build time)
    // In production, this should be configured properly
    console.warn("[DB] SSL required but certificate not found. Using lenient SSL configuration.");
    return {
      rejectUnauthorized: false,
    };
  }
  
  // SSL not required - return undefined to disable SSL
  return undefined;
}

const sslConfig = getSslConfig();
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...(sslConfig && { ssl: sslConfig }),
  // Connection pool configuration to prevent exhaustion
  max: 5, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Connection timeout (10s - increased for slower connections)
  // Don't connect on pool creation - only connect when actually needed
  allowExitOnIdle: true,
});

// Handle pool errors to prevent unhandled rejections
pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
});

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
