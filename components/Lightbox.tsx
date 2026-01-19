'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  children: React.ReactNode;
}

export default function Lightbox({ src, alt, caption, children }: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openLightbox = useCallback(() => setIsOpen(true), []);
  const closeLightbox = useCallback(() => setIsOpen(false), []);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeLightbox]);

  return (
    <>
      <div onClick={openLightbox} className="cursor-zoom-in">
        {children}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
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

          {/* Image container */}
          <div
            className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={src}
                alt={alt}
                width={1920}
                height={1440}
                quality={95}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                priority
              />
            </div>
            {caption && (
              <p className="text-white/80 text-sm mt-3 text-center max-w-2xl">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
