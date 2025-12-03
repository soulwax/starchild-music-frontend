// File: next.config.js

import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  // Electron runs in normal mode, connects to your API server
  // Don't use static export for Electron if you need tRPC/API routes
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
    ],
    unoptimized: process.env.ELECTRON_BUILD === "true", // Required for Electron
  },
};

export default config;
