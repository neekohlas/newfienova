import { basePath } from '@/lib/config';

/**
 * Get the optimized (smaller) version of an image path for inline display.
 * Falls back to original if no optimized version exists.
 */
export function getOptimizedImagePath(originalPath: string): string {
  // Decode the URL-encoded path for matching
  const decodedPath = decodeURIComponent(originalPath);

  // Transform path: /geotagged/image.jpeg -> /images-optimized/geotagged/image.jpg
  const optimizedPath = decodedPath
    .replace(/^\/(geotagged|geotagged2|media)\//, '/images-optimized/$1/')
    .replace(/\.(jpeg|png)$/i, '.jpg');

  return `${basePath}${encodeURI(optimizedPath)}`;
}

/**
 * Get the full resolution image path (original) for lightbox/gallery view.
 */
export function getFullResImagePath(originalPath: string): string {
  return `${basePath}${originalPath}`;
}
