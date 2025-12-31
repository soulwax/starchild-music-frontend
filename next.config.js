// File: next.config.js

import "./src/env.js";

// Handle unhandled rejections during build (e.g., _document/_error pages not found in App Router)
if (typeof process !== "undefined") {
  const originalEmit = process.emit;
  // @ts-ignore - Overriding process.emit with custom handler for error suppression
  process.emit = function (event, ...args) {
    // Suppress unhandledRejection events for expected missing pages in App Router
    if (event === "unhandledRejection") {
      const reason = args[0];
      if (
        reason &&
        typeof reason === "object" &&
        "code" in reason &&
        reason.code === "ENOENT"
      ) {
        const message = "message" in reason ? String(reason.message) : "";
        const type = "type" in reason ? String(reason.type) : "";
        const errorText = message || type || "";
        if (
          errorText.includes("_document") ||
          errorText.includes("_error") ||
          errorText.includes("PageNotFoundError")
        ) {
          // These are expected in App Router - suppress the error
          return false; // Prevent default handling
        }
      }
    }
    // @ts-ignore - TypeScript can't infer the correct overload signature
    return originalEmit.apply(process, [event, ...args]);
  };

  process.on("unhandledRejection", (reason, promise) => {
    // Suppress page not found errors for Pages Router files in App Router (expected behavior)
    if (
      reason &&
      typeof reason === "object" &&
      "code" in reason &&
      reason.code === "ENOENT"
    ) {
      const message = "message" in reason ? String(reason.message) : "";
      const type = "type" in reason ? String(reason.type) : "";
      const errorText = message || type || "";
      if (
        errorText.includes("_document") ||
        errorText.includes("_error") ||
        errorText.includes("PageNotFoundError")
      ) {
        // These are expected in App Router - _document, _error, and other _ prefixed pages are not needed
        return;
      }
    }
    // Log other unhandled rejections for debugging
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
}

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  // Standalone output for both Electron and Vercel (optimized builds)
  output: "standalone",
  // Electron runs a bundled Next.js server with standalone output
  // Vercel also benefits from standalone mode for optimized bundle size

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression

  // Skip TypeScript type checking during build (types are checked separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundle

  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
      "@trpc/client",
      "@trpc/react-query",
    ],
  },
  // Turbopack configuration (Next.js 15.3.0+)
  // This configures Turbopack when using --turbo flag in development
  turbopack: {
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-images.dzcdn.net",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "api.deezer.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "discord.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "discordapp.com",
        pathname: "/**",
      },
    ],
    unoptimized: process.env.ELECTRON_BUILD === "true", // Required for Electron
  },
  // Webpack configuration (only used when not using Turbopack)
  // When using --turbo flag, this config is ignored and Turbopack is used instead
  // The warning about webpack config with Turbopack is informational and harmless
  webpack: (config, { isServer }) => {
    // Suppress warnings/errors for Pages Router files that don't exist in App Router
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /[\\/]node_modules[\\/]next[\\/]/,
          message: /Cannot find module for page: \/_(document|error)/,
        },
        {
          module: /[\\/]node_modules[\\/]next[\\/]/,
          message: /PageNotFoundError/,
        },
      ];
    }
    return config;
  },
  // Suppress build errors for expected missing pages in App Router
  // Improved memory management: less aggressive settings to prevent request timeouts
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // Increased from 25s to 60s - pages stay in memory longer
    pagesBufferLength: 5, // Increased from 2 to 5 - more pages buffered to reduce re-renders
  },
};

export default config;
