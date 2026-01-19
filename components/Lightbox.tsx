'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt: string;
  caption?: string;
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          {hasNavigation && (
            <div className="absolute top-4 left-4 text-white/60 text-sm z-10">
              {activeIndex + 1} / {allMedia.length}
            </div>
          )}

          {/* Previous button */}
          {hasNavigation && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-2 md:p-3"
              aria-label="Previous"
            >
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {hasNavigation && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-2 md:p-3"
              aria-label="Next"
            >
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Media container */}
          <div
            ref={containerRef}
            className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center px-12 md:px-16"
            onClick={(e) => e.stopPropagation()}
            style={getTransformStyle()}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {currentMedia.type === 'video' ? (
                <video
                  key={currentMedia.src}
                  src={currentMedia.src}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh] w-auto h-auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image
                  key={currentMedia.src}
                  src={currentMedia.src}
                  alt={currentMedia.alt}
                  width={1920}
                  height={1440}
                  quality={95}
                  className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                  priority
                />
              )}
            </div>
            {currentMedia.caption && (
              <p className="text-white/80 text-sm mt-3 text-center max-w-2xl">
                {currentMedia.caption}
              </p>
            )}

            {/* Navigation hint on mobile */}
            {hasNavigation && (
              <p className="text-white/40 text-xs mt-2 text-center md:hidden">
                Swipe to navigate • Swipe down to close
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
