// File: drizzle.config.ts

import { existsSync, readFileSync } from "fs";
import path from "path";
import drizzleEnv from "./drizzle.env";

// Determine SSL configuration based on certificate availability
function getSslConfig() {
  const certPath = path.join(process.cwd(), "certs/ca.pem");

  if (existsSync(certPath)) {
    console.log(`[Drizzle] Using SSL certificate: ${certPath}`);
    return {
      rejectUnauthorized: true,
      ca: readFileSync(certPath).toString(),
    };
  }

  // Certificate not found - use lenient SSL with warning
  console.warn(
    "[Drizzle] ⚠️  WARNING: No CA certificate found at certs/ca.pem",
  );
  console.warn(
    "[Drizzle] ⚠️  Using rejectUnauthorized: false - vulnerable to MITM attacks",
  );
  return {
    rejectUnauthorized: false,
  };
}

const config = {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: drizzleEnv.DB_HOST ?? "localhost",
    port: parseInt(drizzleEnv.DB_PORT ?? "5432", 10),
    user: drizzleEnv.DB_ADMIN_USER,
    password: drizzleEnv.DB_ADMIN_PASSWORD,
    database: drizzleEnv.DB_NAME ?? "postgres",
    ssl: getSslConfig(),
  },
};

export default config;
