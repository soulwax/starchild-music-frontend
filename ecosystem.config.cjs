// File: ecosystem.config.cjs

/* File: ecosystem.config.cjs */
/* * */

const dotenv = require("dotenv");
const path = require("path");

// Load .env as single source of truth for PORT configuration
dotenv.config({ path: path.resolve(__dirname, ".env") });
const PORT = process.env.PORT || "3222";

module.exports = {
  apps: [
    {
      // ============================================
      // PRODUCTION CONFIGURATION (OPTIMIZED FORK MODE)
      // ============================================
      // WHY FORK MODE FOR NEXT.JS:
      // ✓ Next.js has built-in concurrency handling (Node.js async I/O)
      // ✓ Next.js standalone mode doesn't work with PM2 cluster (port binding conflicts)
      // ✓ Single optimized instance is more efficient than multiple instances
      // ✓ Automatic restart on crash provides high availability
      // ✓ PM2 reload still provides zero-downtime deployments
      //
      // DEPLOYMENT WORKFLOW:
      // 1. npm run deploy (builds + gracefully reloads instance)
      // 2. PM2 starts new instance → waits for 'ready' signal → kills old instance
      // 3. Zero downtime achieved through graceful reload!
      //
      name: "songbird-frontend-prod",
      script: "scripts/server.js",
      args: "",
      interpreter: "node",

      // FORK MODE: Single optimized instance (Next.js handles concurrency internally)
      instances: 1, // Single instance - Next.js already optimized for concurrent requests
      exec_mode: "fork", // Fork mode (required for Next.js port binding)

      // ============================================
      // MEMORY MANAGEMENT
      // ============================================
      // Optimized memory limits for single instance
      max_memory_restart: "2560M", // Restart if memory exceeds 2.5GB (increased for single instance)
      min_uptime: "30s", // Minimum uptime before considered stable (increased from 10s for Next.js)

      // ============================================
      // AUTO-RESTART & ERROR HANDLING
      // ============================================
      autorestart: true, // Auto-restart on crash
      max_restarts: 10, // Max restarts within restart_delay window
      restart_delay: 5000, // Wait 5s before restart (increased from 4s for graceful shutdown)
      wait_ready: true, // Wait for Next.js ready signal

      // Exponential backoff for restarts (prevents crash loops)
      exp_backoff_restart_delay: 100,

      // Pre-start hook: Ensure build exists before starting
      // This automatically builds if BUILD_ID is missing, preventing crash loops
      pre_start: "node scripts/ensure-build.js",

      // ============================================
      // ENVIRONMENT & VARIABLES
      // ============================================
      env: {
        NODE_ENV: "production",
        PORT: PORT,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORT,
      },

      // ============================================
      // LOGGING (CLUSTER MODE)
      // ============================================
      // Merge logs from all instances for easier debugging
      // Each log line will include instance ID for tracking which instance handled the request
      combine_logs: true,
      merge_logs: true,

      // Log file paths (all instances write to same files with instance ID prefix)
      error_file: "./logs/pm2/error.log",
      out_file: "./logs/pm2/out.log",
      log_file: "./logs/pm2/combined.log",

      // Log formatting
      time: true, // Prefix logs with timestamp
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // PM2 log type (enables JSON mode for better parsing if needed)
      // log_type: "json", // Uncomment for structured JSON logs

      // ============================================
      // PROCESS MONITORING
      // ============================================
      // Disable watch in production (use pm2 reload instead)
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],

      // ============================================
      // ADVANCED OPTIONS
      // ============================================
      // Graceful shutdown
      shutdown_with_message: true,

      // Source map support for better error traces
      source_map_support: true,

      // Instance variables (useful for debugging which instance handled request in cluster mode)
      instance_var: "INSTANCE_ID", // Sets process.env.INSTANCE_ID to instance number (0, 1, 2, etc.)
      increment_var: "INSTANCE_NUMBER", // Sets incrementing number (1, 2, 3, etc.) for human-readable logging

      // ============================================
      // FORK MODE OPTIMIZATIONS
      // ============================================
      // Graceful reloading: Start new instance before killing old one (zero-downtime)
      // PM2 waits for new instance to be ready (via 'ready' signal) before killing old instance
      kill_timeout: 5000, // Grace period before force kill (5s is sufficient for fork mode)
      listen_timeout: 10000, // Wait 10s for app to be ready (Next.js startup time)

      // Node.js memory settings
      node_args: "--max-old-space-size=2560", // Match max_memory_restart limit (prevents OOM before PM2 can restart)

      // ============================================
      // HEALTH CHECKS & MONITORING
      // ============================================
      // PM2 will send SIGINT for graceful shutdown
      // Next.js handles this automatically

      // Health check configuration - PM2 will check if the app is actually responding
      health_check_grace_period: 5000, // Grace period after startup before health checks start
      health_check_fatal_exceptions: true, // Treat health check failures as fatal (restart the app)
      health_check_url: `http://localhost:${PORT}/api/health`, // Health check endpoint - uses PORT from .env
    },
    {
      // ============================================
      // DEVELOPMENT CONFIGURATION
      // ============================================
      name: "songbird-frontend-dev",
      script: "scripts/server.js",
      args: "",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",

      // ============================================
      // MEMORY MANAGEMENT
      // ============================================
      max_memory_restart: "2G",
      min_uptime: "30s",

      // ============================================
      // AUTO-RESTART & ERROR HANDLING
      // ============================================
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,

      // Exponential backoff for restarts
      exp_backoff_restart_delay: 100,

      // No pre-start hook for dev (no build needed)

      // ============================================
      // ENVIRONMENT & VARIABLES
      // ============================================
      env: {
        NODE_ENV: "development",
        PORT: PORT,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: PORT,
      },

      // ============================================
      // LOGGING
      // ============================================
      combine_logs: true,
      merge_logs: true,

      // Separate log files for dev
      error_file: "./logs/pm2/dev-error.log",
      out_file: "./logs/pm2/dev-out.log",
      log_file: "./logs/pm2/dev-combined.log",

      // Log formatting
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // ============================================
      // PROCESS MONITORING
      // ============================================
      // Watch mode enabled for development
      watch: true,
      ignore_watch: ["node_modules", "logs", ".next", "dist", "drizzle"],

      // ============================================
      // ADVANCED OPTIONS
      // ============================================
      shutdown_with_message: true,
      source_map_support: true,
      instance_var: "INSTANCE_ID",

      // ============================================
      // HEALTH CHECKS & MONITORING
      // ============================================
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: true,
      health_check_url: `http://localhost:${PORT}/api/health`, // Health check endpoint - uses PORT from .env
    },
  ],

  // ============================================
  // PM2 DEPLOY CONFIGURATION (Optional)
  // ============================================
  deploy: {
    production: {
      user: "node",
      host: ["darkfloor.art"],
      ref: "origin/main",
      repo: "git@github.com:soulwax/starchild-music-frontend.git",
      path: "/home/soulwax/workspace/Web/Frontends/starchild-music-frontend",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.cjs --env production --update-env",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },
  },
};
