// Site configuration for static export
// This file provides the basePath for GitHub Pages deployment

// For GitHub Pages at neekohlas.github.io/newfienova
// Empty for local development, '/newfienova' for production
const isProd = process.env.NODE_ENV === 'production';
export const basePath = isProd ? '/newfienova' : '';

// Helper to prefix asset paths
export function assetPath(path: string): string {
  // Handle paths that already have the basePath
  if (basePath && path.startsWith(basePath)) {
    return path;
  }
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}
