import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the dashboard runs entirely on mock data, so it can be
  // deployed to Vercel (or any static host) without a server.
  output: "export",
  // Relative asset paths only for the self-hosted preview build (PREVIEW=1);
  // Vercel deploys use the default absolute paths.
  assetPrefix: process.env.PREVIEW ? "./" : undefined,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
