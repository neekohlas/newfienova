'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import PostMap from './PostMap';
import Comments from './Comments';
import { basePath } from '@/lib/config';

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

interface PostProps {
  id: string;
  title: string;
  content: string;
  formattedDate: string;
  author: string;
  images: string[];
  heroImage?: string | null;
  videos?: string[];
  imageMatches?: ImageMatches;
  comments?: Comment[];
  embeddedMap?: EmbeddedMap;
}

// Content block can be text, image, or embedded map placeholder
type ContentBlock =
  | { type: 'text'; html: string; isH3: boolean }
  | { type: 'image'; imageIndex: number }
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
  imageMatches = {},
  comments = [],
  embeddedMap,
}: PostProps) {
  // Process content to extract text blocks and image positions
  const contentBlocks = useMemo((): ContentBlock[] => {
    const hasVideosNow = videos.length > 0;
    const hasEmbeddedMap = !!embeddedMap;

    // First, replace img tags with unique placeholders to track their positions
    let imageIndex = 0;
    let withPlaceholders = content
      // Remove object/embed tags (old Blogger video embeds)
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, hasVideosNow ? '' : '<p><em>[Video no longer available]</em></p>')
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

      // Check if this part contains any placeholders (images or map)
      const allPlaceholderRegex = /<!--(IMG_PLACEHOLDER_(\d+)|EMBEDDED_MAP_PLACEHOLDER)-->/g;
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
      if (block.type === 'image' || block.type === 'embeddedMap') return true;
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

  return (
    <article id={`post-${id}`} className="py-16 border-b border-stone-200 last:border-b-0">
      <div className="article-container">
        {/* Date and author */}
        <p className="byline mb-3">{formattedDate}</p>

        {/* Title with anchor for navigation */}
        <h2 id={`title-${id}`} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight scroll-mt-24">
          {title}
        </h2>

        {/* Map showing photo locations for this entry - at top */}
        <PostMap
          postId={id}
          postImages={images}
          imageMatches={imageMatches}
        />

        {/* Content with images in their original positions */}
        <div className="post-content" suppressHydrationWarning>
          {contentBlocks.map((block, idx) => {
            if (block.type === 'image') {
              // Render image from the images array at this position
              const imageSrc = contentImages[block.imageIndex];
              if (!imageSrc) return null;

              return (
                <figure key={`img-${idx}`} className="my-8">
                  <Image
                    src={`${basePath}${imageSrc}`}
                    alt={`Photo from ${title}`}
                    width={1600}
                    height={1200}
                    quality={90}
                    className="w-full h-auto"
                  />
                </figure>
              );
            }

            if (block.type === 'embeddedMap' && embeddedMap) {
              // Render embedded map inline where the original iframe was
              // Wrapper div with pointer-events-none prevents scroll hijacking until user clicks
              // bbox format: left,bottom,right,top (west,south,east,north)
              const lat = embeddedMap.center[0];
              const lng = embeddedMap.center[1];
              const latSpan = 0.3;
              const lngSpan = 0.5;
              const bbox = `${lng - lngSpan},${lat - latSpan},${lng + lngSpan},${lat + latSpan}`;
              return (
                <div key={`map-${idx}`} className="my-8">
                  <div
                    className="relative group"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div
                      className="absolute inset-0 z-10 cursor-pointer group-focus-within:hidden"
                      onClick={(e) => {
                        // Remove the overlay on click to allow map interaction
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`}
                      width="100%"
                      height="400"
                      style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                      title={embeddedMap.title}
                    />
                  </div>
                  <p className="text-sm text-stone-500 mt-2 text-center">Hint: follow the dotted lines.</p>
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

          {/* Videos section */}
          {videos.length > 0 && (
            <div className="mt-8 space-y-6">
              {videos.map((video, idx) => (
                <figure key={idx} className="my-8">
                  <video
                    src={`${basePath}${video}`}
                    controls
                    className="w-full rounded-lg shadow-lg"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <figcaption className="text-sm text-stone-500 mt-2 text-center">
                    Video from the trip
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {/* Comments from original blog */}
          <Comments comments={comments} />
        </div>
      </div>
    </article>
  );
}
