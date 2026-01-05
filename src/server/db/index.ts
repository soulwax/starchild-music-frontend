// File: src/server/db/index.ts

import { env } from "@/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";
import * as schema from "./schema";

if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for the application. It is only optional for drizzle-kit which can fall back to legacy DB_* variables."
  );
}

function getSslConfig() {

  const isCloudDb = env.DATABASE_URL!.includes("aivencloud.com") ||
                    env.DATABASE_URL!.includes("rds.amazonaws.com") ||
                    env.DATABASE_URL!.includes("sslmode=");

  if (!isCloudDb && env.DATABASE_URL!.includes("localhost")) {

    console.log("[DB] Local database detected. SSL disabled.");
    return undefined;
  }

  const possibleCertPaths = [
    path.join(process.cwd(), "certs/ca.pem"),
    path.join(__dirname, "../../certs/ca.pem"),
    path.join(__dirname, "../../../certs/ca.pem"),
  ];

  for (const certPath of possibleCertPaths) {
    if (existsSync(certPath)) {
      console.log(`[DB] Cloud database detected. Using SSL certificate: ${certPath}`);
      return {

        rejectUnauthorized: process.env.NODE_ENV === "production",
        ca: readFileSync(certPath).toString(),
      };
    }
  }

  if (process.env.DB_SSL_CA) {
    console.log("[DB] Cloud database detected. Using SSL certificate from DB_SSL_CA environment variable");
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: process.env.DB_SSL_CA,
    };
  }

  console.warn("[DB] ⚠️  WARNING: Cloud database detected but no CA certificate found!");
  console.warn("[DB] ⚠️  Using rejectUnauthorized: false - vulnerable to MITM attacks");
  console.warn("[DB] ⚠️  Set DB_SSL_CA environment variable or place your CA certificate at: certs/ca.pem");
  return {
    rejectUnauthorized: false,
  };
}

const sslConfig = getSslConfig();

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...(sslConfig && { ssl: sslConfig }),

  max: isVercel ? 2 : 10,
  min: 0,
  idleTimeoutMillis: isVercel ? 10000 : 60000,
  connectionTimeoutMillis: 10000,

  statement_timeout: 30000,

  ...(isVercel && {
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  }),
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);

});

if (process.env.NODE_ENV === "development") {
  pool.on("connect", () => {
    console.log("[DB] New client connected to pool");
  });

  pool.on("remove", () => {
    console.log("[DB] Client removed from pool");
  });
}

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
export { pool };

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
