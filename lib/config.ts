// Site configuration for static export
// This file provides the basePath for GitHub Pages deployment

// For GitHub Pages at neekohlas.github.io/newfienova
// Set to empty string for local development or root domain hosting
export const basePath = '/newfienova';

// Helper to prefix asset paths
export function assetPath(path: string): string {
  // Handle paths that already have the basePath
  if (path.startsWith(basePath)) {
    return path;
  }
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}
