import { basePath } from '@/lib/config';

export interface MediaItem {
  type: 'image' | 'video' | 'map' | 'postHeader';
  src: string;
  alt: string;
  caption?: string;
  // Original path without basePath, for image optimization transforms
  originalPath?: string;
  mapCenter?: [number, number];
  mapZoom?: number;
  // For postHeader type
  postId?: string;
  postTitle?: string;
  postDate?: string;
  photoLocations?: Array<{ lat: number; lng: number; label?: string }>;
}

interface ImageMatch {
  latitude: number;
  longitude: number;
  path: string;
}

interface ImageMatches {
  [mediaPath: string]: ImageMatch;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  images: string[];
  videos?: string[];
  formattedDate?: string;
  embeddedMap?: {
    center: [number, number];
    zoom: number;
    title: string;
  };
}

interface ImageCaptions {
  [imagePath: string]: string;
}

interface VideoCaptions {
  [videoPath: string]: string;
}

// Extract media items from a post in the order they appear in content
export function extractMediaFromPost(
  post: PostData,
  imageCaptions: ImageCaptions,
  videoCaptions: VideoCaptions
): MediaItem[] {
  const mediaItems: MediaItem[] = [];
  const videos = post.videos || [];
  const hasVideos = videos.length > 0;
  const hasEmbeddedMap = !!post.embeddedMap;

  // Process content to find media positions (same logic as Post.tsx)
  let imageIndex = 0;
  let videoIndex = 0;

  const withPlaceholders = post.content
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, hasVideos ? (() => `<!--VIDEO_PLACEHOLDER_${videoIndex++}-->`) : (() => ''))
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, hasEmbeddedMap ? '<!--EMBEDDED_MAP_PLACEHOLDER-->' : '')
    .replace(/<small[^>]*>[\s\S]*?View Larger Map[\s\S]*?<\/small>/gi, '')
    .replace(/<a[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/a>|<img[^>]*>/gi, () => `<!--IMG_PLACEHOLDER_${imageIndex++}-->`)
    .replace(/<a[^>]*>\s*<\/a>/gi, '');

  // Split and process content blocks
  const parts = withPlaceholders.split(/<\/?p>/gi);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const allPlaceholderRegex = /<!--(IMG_PLACEHOLDER_(\d+)|VIDEO_PLACEHOLDER_(\d+)|EMBEDDED_MAP_PLACEHOLDER)-->/g;
    let match;

    while ((match = allPlaceholderRegex.exec(trimmed)) !== null) {
      if (match[1].startsWith('IMG_PLACEHOLDER_')) {
        const idx = parseInt(match[2], 10);
        const imageSrc = post.images[idx];
        if (imageSrc) {
          const caption = imageCaptions[imageSrc];
          mediaItems.push({
            type: 'image',
            src: `${basePath}${imageSrc}`,
            originalPath: imageSrc,
            alt: caption || `Photo from ${post.title}`,
            caption,
          });
        }
      } else if (match[1].startsWith('VIDEO_PLACEHOLDER_')) {
        const idx = parseInt(match[3], 10);
        const videoSrc = videos[idx];
        if (videoSrc) {
          const caption = videoCaptions[videoSrc] || 'Video from the trip';
          mediaItems.push({
            type: 'video',
            src: `${basePath}${videoSrc}`,
            originalPath: videoSrc,
            alt: caption,
            caption,
          });
        }
      } else if (match[1] === 'EMBEDDED_MAP_PLACEHOLDER' && post.embeddedMap) {
        mediaItems.push({
          type: 'map',
          src: '',
          alt: post.embeddedMap.title || 'Route map',
          caption: post.embeddedMap.title,
          mapCenter: post.embeddedMap.center,
          mapZoom: post.embeddedMap.zoom,
        });
      }
    }
  }

  return mediaItems;
}

// Build global media array from all posts
export function buildGlobalMediaArray(
  posts: PostData[],
  imageCaptions: ImageCaptions,
  videoCaptions: VideoCaptions,
  imageMatches?: ImageMatches
): { globalMedia: MediaItem[]; offsets: Map<string, number> } {
  const globalMedia: MediaItem[] = [];
  const offsets = new Map<string, number>();

  for (const post of posts) {
    offsets.set(post.id, globalMedia.length);

    // Extract photo locations for this post from imageMatches
    const photoLocations: Array<{ lat: number; lng: number; label?: string }> = [];
    if (imageMatches) {
      for (const imagePath of post.images) {
        const match = imageMatches[imagePath];
        if (match && match.latitude && match.longitude) {
          photoLocations.push({
            lat: match.latitude,
            lng: match.longitude,
          });
        }
      }
    }

    // Add post header as the first item for this post (only if post has media)
    const postMedia = extractMediaFromPost(post, imageCaptions, videoCaptions);
    if (postMedia.length > 0) {
      globalMedia.push({
        type: 'postHeader',
        src: '',
        alt: post.title,
        postId: post.id,
        postTitle: post.title,
        postDate: post.formattedDate,
        photoLocations: photoLocations.length > 0 ? photoLocations : undefined,
      });
    }

    globalMedia.push(...postMedia);
  }

  return { globalMedia, offsets };
}
