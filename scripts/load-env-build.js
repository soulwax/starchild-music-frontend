#!/usr/bin/env node
// File: scripts/load-env-build.js

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Electron builds ONLY use .env.local for environment configuration
// This ensures consistent configuration and avoids conflicts with multiple env files
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Get the command from arguments
const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("❌ No command provided");
  console.log("Usage: node load-env-build.js <command>");
  process.exit(1);
}

console.log(`🔧 Loading environment from .env.local only`);
console.log(`📦 Running: ${command}`);

try {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
  console.log("✅ Command completed successfully");
} catch (error) {
  console.error("❌ Command failed");
  let exitCode = 1;
  if (error && typeof error === "object" && "status" in error) {
    exitCode = typeof error.status === "number" ? error.status : 1;
  }
  process.exit(exitCode);
}
