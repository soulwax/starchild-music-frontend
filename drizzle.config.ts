// File: drizzle.config.ts

import drizzleEnv from "./drizzle.env";

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
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates
    },
  },
};

export default config;
