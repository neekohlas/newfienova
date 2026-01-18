import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',

  // Base path for GitHub Pages (repo name)
  // Must match the value in lib/config.ts
  basePath: '/newfienova',
  assetPrefix: '/newfienova/',

  // Configure images for static export
  images: {
    unoptimized: true,
  },

  // Trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
