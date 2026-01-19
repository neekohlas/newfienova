import { basePath } from '@/lib/config';

/**
 * Transform an original image path to an optimized path
 */
function transformPath(originalPath: string, optimizedDir: string): string {
  // Decode the URL-encoded path for matching
  const decodedPath = decodeURIComponent(originalPath);

  // Transform path: /geotagged/image.jpeg -> /images-inline/geotagged/image.jpg
  const optimizedPath = decodedPath
    .replace(/^\/(geotagged|geotagged2|media)\//, `/${optimizedDir}/$1/`)
    .replace(/\.(jpeg|png)$/i, '.jpg');

  return `${basePath}${encodeURI(optimizedPath)}`;
}

/**
 * Get the inline (small) version of an image for blog post display.
 * 800px wide, quality 60
 */
export function getInlineImagePath(originalPath: string): string {
  return transformPath(originalPath, 'images-inline');
}

/**
 * Get the gallery (medium) version of an image for lightbox/fullscreen.
 * 1400px wide, quality 75
 */
export function getGalleryImagePath(originalPath: string): string {
  return transformPath(originalPath, 'images-gallery');
}

/**
 * Get the full resolution image path (original).
 * Only use for downloads or special cases.
 */
export function getFullResImagePath(originalPath: string): string {
  return `${basePath}${originalPath}`;
}

// Backwards compatibility alias
export const getOptimizedImagePath = getInlineImagePath;
