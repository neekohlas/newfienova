import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',

  // Base path for GitHub Pages (repo name)
  basePath: isProd ? '/newfienova' : '',
  assetPrefix: isProd ? '/newfienova/' : '',

  // Configure images for static export
  images: {
    unoptimized: true,
  },

  // Trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
