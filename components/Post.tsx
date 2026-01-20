'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PostMap from './PostMap';
import Comments from './Comments';
import Lightbox, { MediaItem } from './Lightbox';
import { basePath } from '@/lib/config';
import { getOptimizedImagePath } from '@/lib/image-utils';
import videoThumbnails from '@/data/video-thumbnails.json';

// Dynamically import the embedded map component
const EmbeddedMapComponent = dynamic(() => import('./EmbeddedMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-stone-100 rounded-lg flex items-center justify-center h-[400px]">
      <p className="text-stone-400 text-sm">Loading map...</p>
    </div>
  )
});

interface ImageMatch {
  geotaggedFile: string;
  geotaggedPath: string;
  similarity: number;
  path: string;
  latitude: number;
  longitude: number;
  date: string;
}

interface ImageMatches {
  [mediaPath: string]: ImageMatch;
}

interface Comment {
  author: string;
  date: string;
  text: string;
}

interface EmbeddedMap {
  center: [number, number];
  zoom: number;
  title: string;
}

interface VideoCaptions {
  [videoPath: string]: string;
}

interface ImageCaptions {
  [imagePath: string]: string;
}

interface PostProps {
  id: string;
  title: string;
  content: string;
  formattedDate: string;
  author: string;
  images: string[];
  heroImage?: string | null;
  videos?: string[];
  videoCaptions?: VideoCaptions;
  imageCaptions?: ImageCaptions;
  imageMatches?: ImageMatches;
  comments?: Comment[];
  embeddedMap?: EmbeddedMap;
  // For cross-post navigation
  globalMedia?: MediaItem[];
  globalMediaOffset?: number;
}

// Content block can be text, image, video, or embedded map placeholder
type ContentBlock =
  | { type: 'text'; html: string; isH3: boolean }
  | { type: 'image'; imageIndex: number }
  | { type: 'video'; videoIndex: number }
  | { type: 'embeddedMap' };

export default function Post({
  id,
  title,
  content,
  formattedDate,
  author,
  images,
  heroImage,
  videos = [],
  videoCaptions = {},
  imageCaptions = {},
  imageMatches = {},
  comments = [],
  embeddedMap,
  globalMedia,
  globalMediaOffset = 0,
}: PostProps) {
  // Track if we're mounted on client to avoid hydration mismatches with complex HTML
  const [isMounted, setIsMounted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Copy post link to clipboard
  const copyPostLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#post-${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [id]);

  // Process content to extract text blocks and image positions
  const contentBlocks = useMemo((): ContentBlock[] => {
    const hasVideosNow = videos.length > 0;
    const hasEmbeddedMap = !!embeddedMap;

    // First, replace img tags with unique placeholders to track their positions
    let imageIndex = 0;
    let videoIndex = 0;
    let withPlaceholders = content
      // Replace object/embed tags (old Blogger video embeds) with video placeholders
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, hasVideosNow ? (() => `<!--VIDEO_PLACEHOLDER_${videoIndex++}-->`) : (() => '<p><em>[Video no longer available]</em></p>'))
      .replace(/<embed[^>]*>/gi, '')
      // Replace iframe embeds with map placeholder if we have embeddedMap, otherwise remove
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, hasEmbeddedMap ? '<!--EMBEDDED_MAP_PLACEHOLDER-->' : (hasVideosNow ? '' : '<p><em>[Embedded content]</em></p>'))
      // Remove "View Larger Map" links in small tags (old Google Maps remnant)
      .replace(/<small[^>]*>[\s\S]*?View Larger Map[\s\S]*?<\/small>/gi, '')
      // Replace images with placeholders (keeping track of order)
      // Use single regex to match both anchor-wrapped and standalone images in visual order
      .replace(/<a[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/a>|<img[^>]*>/gi, () => `<!--IMG_PLACEHOLDER_${imageIndex++}-->`)
      // Remove empty anchor tags (after img replacement)
      .replace(/<a[^>]*>\s*<\/a>/gi, '')
      // Remove empty divs
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      // Remove table elements (old Blogger formatting)
      .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '')
      // Remove tbody, tr, td
      .replace(/<\/?(table|tbody|tr|td)[^>]*>/gi, '')
      // Clean up multiple br tags
      .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();

    // Split by paragraphs while preserving image placeholders
    const blocks: ContentBlock[] = [];

    // Split by p tags and process
    const parts = withPlaceholders.split(/<\/?p>/gi);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Check if this part contains any placeholders (images, videos, or map)
      const allPlaceholderRegex = /<!--(IMG_PLACEHOLDER_(\d+)|VIDEO_PLACEHOLDER_(\d+)|EMBEDDED_MAP_PLACEHOLDER)-->/g;
      let lastIndex = 0;
      let match;
      let foundPlaceholder = false;

      while ((match = allPlaceholderRegex.exec(trimmed)) !== null) {
        foundPlaceholder = true;
        // Add text before the placeholder if any
        const textBefore = trimmed.slice(lastIndex, match.index).trim();
        if (textBefore) {
          const stripped = textBefore.replace(/<br\s*\/?>/gi, '').trim();
          if (stripped) {
            const isH3 = textBefore.includes('<h3>');
            blocks.push({ type: 'text', html: textBefore, isH3 });
          }
        }

        // Add the appropriate placeholder type
        if (match[1].startsWith('IMG_PLACEHOLDER_')) {
          blocks.push({ type: 'image', imageIndex: parseInt(match[2], 10) });
        } else if (match[1].startsWith('VIDEO_PLACEHOLDER_')) {
          blocks.push({ type: 'video', videoIndex: parseInt(match[3], 10) });
        } else if (match[1] === 'EMBEDDED_MAP_PLACEHOLDER') {
          blocks.push({ type: 'embeddedMap' });
        }
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text after last placeholder (only if we found placeholders)
      if (foundPlaceholder) {
        const remaining = trimmed.slice(lastIndex).trim();
        if (remaining) {
          const stripped = remaining.replace(/<br\s*\/?>/gi, '').trim();
          if (stripped) {
            const isH3 = remaining.includes('<h3>');
            blocks.push({ type: 'text', html: remaining, isH3 });
          }
        }
      } else {
        // No placeholders found, add the whole part as text
        const stripped = trimmed.replace(/<br\s*\/?>/gi, '').trim();
        // Skip empty paragraphs
        if (!stripped) continue;

        const isH3 = trimmed.includes('<h3>');
        blocks.push({ type: 'text', html: trimmed, isH3 });
      }
    }

    // Remove empty paragraphs that are just whitespace/br
    return blocks.filter(block => {
      if (block.type === 'image' || block.type === 'video' || block.type === 'embeddedMap') return true;
      if (block.type === 'text') {
        const stripped = block.html.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').trim();
        return stripped.length > 0;
      }
      return false;
    });
  }, [content, videos.length, embeddedMap]);

  // Get the images array for rendering
  const contentImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    return images;
  }, [images]);

  // Build array of all media items in order of appearance for lightbox navigation
  const allMedia = useMemo((): MediaItem[] => {
    const mediaItems: MediaItem[] = [];

    for (const block of contentBlocks) {
      if (block.type === 'image') {
        const imageSrc = contentImages[block.imageIndex];
        if (imageSrc) {
          const caption = imageCaptions[imageSrc];
          mediaItems.push({
            type: 'image',
            src: `${basePath}${imageSrc}`,
            originalPath: imageSrc,
            alt: caption || `Photo from ${title}`,
            caption,
          });
        }
      } else if (block.type === 'video') {
        const videoSrc = videos[block.videoIndex];
        if (videoSrc) {
          const caption = videoCaptions[videoSrc] || 'Video from the trip';
          const posterSrc = (videoThumbnails as Record<string, string>)[videoSrc];
          mediaItems.push({
            type: 'video',
            src: `${basePath}${videoSrc}`,
            originalPath: videoSrc,
            alt: caption,
            caption,
            poster: posterSrc ? `${basePath}${posterSrc}` : undefined,
          });
        }
      } else if (block.type === 'embeddedMap' && embeddedMap) {
        mediaItems.push({
          type: 'map',
          src: '',
          alt: embeddedMap.title || 'Route map',
          caption: embeddedMap.title,
          mapCenter: embeddedMap.center,
          mapZoom: embeddedMap.zoom,
        });
      }
    }

    return mediaItems;
  }, [contentBlocks, contentImages, videos, imageCaptions, videoCaptions, title, embeddedMap]);

  // Track which media index we're at as we render
  let mediaCounter = 0;

  // Use global media array if available, otherwise use local
  const lightboxMedia = globalMedia || allMedia;
  // Add 1 to offset when using globalMedia to account for postHeader
  const mediaOffset = globalMedia ? globalMediaOffset + 1 : 0;

  const hasMedia = allMedia.length > 0;

  return (
    <article id={`post-${id}`} className="py-16 border-b border-stone-200 last:border-b-0">
      <div className="article-container">
        {/* Date and author */}
        <p className="byline text-stone-500 mb-3">{formattedDate}</p>

        {/* Title with anchor for navigation */}
        <h2 id={`title-${id}`} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight scroll-mt-24">
          {title}
        </h2>

        {/* Copy link button */}
        <button
          onClick={copyPostLink}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-8"
          aria-label="Copy link to this entry"
        >
          {linkCopied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Link copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Copy link to this entry</span>
            </>
          )}
        </button>

        {/* Map showing photo locations for this entry - at top */}
        <PostMap
          postId={id}
          postImages={images}
          postVideos={videos}
          imageMatches={imageMatches}
        />

        {/* Content with images in their original positions */}
        <div className="post-content" suppressHydrationWarning>
          {!isMounted ? (
            // Placeholder during SSR to avoid hydration mismatch with complex HTML
            <div className="animate-pulse">
              <div className="h-4 bg-stone-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-stone-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-stone-200 rounded w-5/6 mb-4"></div>
            </div>
          ) : contentBlocks.map((block, idx) => {
            if (block.type === 'image') {
              // Render image from the images array at this position
              const imageSrc = contentImages[block.imageIndex];
              if (!imageSrc) return null;

              const caption = imageCaptions[imageSrc];
              const currentMediaIndex = mediaOffset + mediaCounter++;

              return (
                <figure key={`img-${idx}`} className="my-8" suppressHydrationWarning>
                  <Lightbox
                    src={`${basePath}${imageSrc}`}
                    alt={caption || `Photo from ${title}`}
                    caption={caption}
                    allMedia={lightboxMedia}
                    currentIndex={currentMediaIndex}
                  >
                    <Image
                      src={getOptimizedImagePath(imageSrc)}
                      alt={caption || `Photo from ${title}`}
                      width={800}
                      height={600}
                      loading="lazy"
                      className="w-full h-auto"
                    />
                  </Lightbox>
                  {caption && (
                    <figcaption className="text-sm text-stone-500 text-left" suppressHydrationWarning>
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === 'video') {
              // Render video inline where it appears in content
              const videoSrc = videos[block.videoIndex];
              if (!videoSrc) return null;

              const caption = videoCaptions[videoSrc] || 'Video from the trip';
              const currentMediaIndex = mediaOffset + mediaCounter++;

              const posterSrc = (videoThumbnails as Record<string, string>)[videoSrc];

              return (
                <figure key={`video-${idx}`} className="my-8" suppressHydrationWarning>
                  <Lightbox
                    src={`${basePath}${videoSrc}`}
                    alt={caption}
                    caption={caption}
                    allMedia={lightboxMedia}
                    currentIndex={currentMediaIndex}
                  >
                    <video
                      src={`${basePath}${videoSrc}`}
                      poster={posterSrc ? `${basePath}${posterSrc}` : undefined}
                      controls
                      className="w-full rounded-lg shadow-lg"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </Lightbox>
                  {caption && (
                    <figcaption className="text-sm text-stone-500 text-left" suppressHydrationWarning>
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === 'embeddedMap' && embeddedMap) {
              // Render embedded map using Leaflet for reliable zoom control
              const currentMediaIndex = mediaOffset + mediaCounter++;
              return (
                <div key={`map-${idx}`} className="my-8" suppressHydrationWarning>
                  <Lightbox
                    src=""
                    alt={embeddedMap.title || 'Route map'}
                    caption={embeddedMap.title}
                    allMedia={lightboxMedia}
                    currentIndex={currentMediaIndex}
                  >
                    <div className="rounded-lg overflow-hidden shadow-md cursor-zoom-in">
                      <EmbeddedMapComponent
                        center={embeddedMap.center}
                        zoom={embeddedMap.zoom}
                        title={embeddedMap.title}
                      />
                    </div>
                  </Lightbox>
                  <p className="text-sm text-stone-500 mt-2 text-center" suppressHydrationWarning>Where might we be headed next? (Hint: follow the dotted lines.)</p>
                </div>
              );
            }

            // Render text block
            if (block.type === 'text') {
              // Check if content has block-level elements that can't be inside <p>
              const hasBlockElements = /<(ul|ol|div|table|blockquote|pre|h[1-6])/i.test(block.html);

              return (
                <div key={idx} suppressHydrationWarning>
                  {block.isH3 ? (
                    <h3
                      className="text-xl font-bold mt-8 mb-4 text-stone-800"
                      style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                      dangerouslySetInnerHTML={{ __html: block.html.replace(/<\/?h3>/gi, '') }}
                      suppressHydrationWarning
                    />
                  ) : hasBlockElements ? (
                    <div dangerouslySetInnerHTML={{ __html: block.html }} suppressHydrationWarning />
                  ) : (
                    <p dangerouslySetInnerHTML={{ __html: block.html }} suppressHydrationWarning />
                  )}
                </div>
              );
            }

            return null;
          })}

          {/* Photo gallery hint - bottom of post */}
          {hasMedia && allMedia.length > 1 && (
            <p className="text-sm text-stone-400 italic mt-8 text-center">
              Click any photo to open the gallery and browse the entire journey
            </p>
          )}

          {/* Comments from original blog */}
          <Comments comments={comments} />
        </div>
      </div>
    </article>
  );
}
