'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

export interface MediaItem {
  type: 'image' | 'video' | 'map' | 'postHeader';
  src: string;
  alt: string;
  caption?: string;
  // For maps
  mapCenter?: [number, number];
  mapZoom?: number;
  // For postHeader
  postId?: string;
  postTitle?: string;
  postDate?: string;
  photoLocations?: Array<{ lat: number; lng: number; label?: string }>;
}

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  children: React.ReactNode;
  // For navigation between all media
  allMedia?: MediaItem[];
  currentIndex?: number;
}

export default function Lightbox({
  src,
  alt,
  caption,
  children,
  allMedia = [],
  currentIndex = 0
}: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDelta, setTouchDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasNavigation = allMedia.length > 1;
  const currentMedia = hasNavigation ? allMedia[activeIndex] : { type: 'image' as const, src, alt, caption };

  const openLightbox = useCallback(() => {
    setActiveIndex(currentIndex);
    setIsOpen(true);
  }, [currentIndex]);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    setTouchDelta({ x: 0, y: 0 });
  }, []);

  const goToPrev = useCallback(() => {
    if (hasNavigation) {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1));
    }
  }, [hasNavigation, allMedia.length]);

  const goToNext = useCallback(() => {
    if (hasNavigation) {
      setActiveIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0));
    }
  }, [hasNavigation, allMedia.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeLightbox, goToPrev, goToNext]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = e.touches[0].clientY - touchStart.y;
    setTouchDelta({ x: deltaX, y: deltaY });
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart) return;

    const { x: deltaX, y: deltaY } = touchDelta;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Swipe down to close (if vertical swipe is dominant and > 100px)
    if (absY > absX && deltaY > 100) {
      closeLightbox();
    }
    // Swipe left/right to navigate (if horizontal swipe is dominant and > 50px)
    else if (absX > absY && absX > 50) {
      if (deltaX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }

    setTouchStart(null);
    setTouchDelta({ x: 0, y: 0 });
    setIsDragging(false);
  }, [touchStart, touchDelta, closeLightbox, goToPrev, goToNext]);

  // Calculate transform for drag feedback
  const getTransformStyle = () => {
    if (!isDragging) return {};
    const { x, y } = touchDelta;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    // If swiping down, show vertical movement
    if (absY > absX && y > 0) {
      return {
        transform: `translateY(${y}px)`,
        opacity: Math.max(0.3, 1 - y / 300),
      };
    }
    // If swiping horizontally, show slight horizontal movement
    if (absX > absY) {
      return {
        transform: `translateX(${x * 0.3}px)`,
      };
    }
    return {};
  };

  return (
    <>
      <div onClick={openLightbox} className="cursor-zoom-in">
        {children}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button - top right */}
          <button
            onClick={closeLightbox}
            className="absolute top-3 right-3 text-white/50 hover:text-white z-20 p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter - top left */}
          {hasNavigation && (
            <div className="absolute top-4 left-4 text-white/50 text-sm z-20">
              {activeIndex + 1} / {allMedia.length}
            </div>
          )}

          {/* Media container - full size */}
          <div
            ref={containerRef}
            className="relative w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={getTransformStyle()}
          >
            {/* Previous button - overlaid on left edge */}
            {hasNavigation && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-0 top-0 bottom-0 w-16 md:w-24 flex items-center justify-start pl-2 md:pl-4 text-white/30 hover:text-white/80 z-10 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next button - overlaid on right edge */}
            {hasNavigation && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-0 top-0 bottom-0 w-16 md:w-24 flex items-center justify-end pr-2 md:pr-4 text-white/30 hover:text-white/80 z-10 transition-colors"
                aria-label="Next"
              >
                <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* The actual media */}
            <div className="relative max-w-[100vw] max-h-[85vh] md:max-h-[90vh] flex items-center justify-center px-2 md:px-4">
              {currentMedia.type === 'postHeader' ? (
                <div className="w-[90vw] max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
                  {/* Decorative line */}
                  <div className="w-16 h-0.5 bg-white/20 mb-8" />

                  {/* Post date */}
                  <p className="text-white/50 text-sm md:text-base mb-4 tracking-wide uppercase">
                    {currentMedia.postDate}
                  </p>

                  {/* Post title */}
                  <h2 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold leading-tight text-center mb-8">
                    {currentMedia.postTitle}
                  </h2>

                  {/* Photo count and map link */}
                  {currentMedia.photoLocations && currentMedia.photoLocations.length > 0 && (
                    <div className="text-center">
                      <p className="text-white/30 text-sm mb-4">
                        {currentMedia.photoLocations.length} geotagged photo{currentMedia.photoLocations.length !== 1 ? 's' : ''} from this entry
                      </p>
                      {currentMedia.postId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeLightbox();
                            // Small delay to let lightbox close, then scroll
                            setTimeout(() => {
                              const element = document.getElementById(`post-${currentMedia.postId}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                          className="text-white/50 hover:text-white text-sm underline underline-offset-4 transition-colors"
                        >
                          View photo locations on the map
                        </button>
                      )}
                    </div>
                  )}

                  {/* Decorative line */}
                  <div className="w-16 h-0.5 bg-white/20 mt-8" />
                </div>
              ) : currentMedia.type === 'video' ? (
                <video
                  key={currentMedia.src}
                  src={currentMedia.src}
                  controls
                  className="max-w-full max-h-[80vh] md:max-h-[85vh] w-auto h-auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : currentMedia.type === 'map' ? (
                <div className="w-[90vw] h-[70vh] md:w-[80vw] md:h-[80vh] bg-stone-800 rounded-lg flex items-center justify-center">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${(currentMedia.mapCenter?.[1] || 0) - 2}%2C${(currentMedia.mapCenter?.[0] || 0) - 1}%2C${(currentMedia.mapCenter?.[1] || 0) + 2}%2C${(currentMedia.mapCenter?.[0] || 0) + 1}&layer=mapnik`}
                    className="w-full h-full rounded-lg"
                    style={{ border: 0 }}
                  />
                </div>
              ) : (
                <Image
                  key={currentMedia.src}
                  src={currentMedia.src}
                  alt={currentMedia.alt}
                  width={1920}
                  height={1440}
                  quality={95}
                  className="max-w-full max-h-[80vh] md:max-h-[85vh] w-auto h-auto object-contain"
                  priority
                />
              )}
            </div>

            {/* Caption below media (not for postHeader) */}
            {currentMedia.type !== 'postHeader' && currentMedia.caption && (
              <p className="text-white/70 text-sm mt-3 text-center max-w-2xl px-4">
                {currentMedia.caption}
              </p>
            )}

            {/* Navigation hint on mobile */}
            {hasNavigation && (
              <p className="text-white/30 text-xs mt-2 text-center md:hidden">
                Swipe to navigate • Swipe down to close
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
