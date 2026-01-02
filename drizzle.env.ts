// File: drizzle.env.ts

import "dotenv/config";
import { config as dotenvConfig } from "dotenv";

// Load .env.local explicitly (dotenv/config may not load it by default)
// This ensures DATABASE_URL from .env.local is available
dotenvConfig({ path: ".env.local" });

// If DATABASE_URL is set, we don't need individual DB credentials
const useConnectionString = !!process.env.DATABASE_URL;

const required = (key: string) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const optional = (key: string) => {
  return process.env[key] ?? "";
};

const config = {
  DB_HOST: useConnectionString ? optional("DB_HOST") : required("DB_HOST"),
  DB_PORT: useConnectionString ? optional("DB_PORT") : required("DB_PORT"),
  DB_ADMIN_USER: useConnectionString ? optional("DB_ADMIN_USER") : required("DB_ADMIN_USER"),
  DB_ADMIN_PASSWORD: useConnectionString ? optional("DB_ADMIN_PASSWORD") : required("DB_ADMIN_PASSWORD"),
  DB_NAME: useConnectionString ? optional("DB_NAME") : required("DB_NAME"),
};

export default config;
