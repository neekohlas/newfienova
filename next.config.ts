import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/newfienova' : '';

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',

  // Base path for GitHub Pages (repo name)
  basePath,
  assetPrefix: isProd ? '/newfienova/' : '',

  // Expose base path to client-side code
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  // Configure images for static export
  images: {
    unoptimized: true,
  },

  // Trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
