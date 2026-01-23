'use client';

import Image from 'next/image';
import { basePath } from '@/lib/config';

interface HeroProps {
  title: string;
  subtitle: string;
  dateRange: string;
  backgroundImage?: string;
}

export default function Hero({ title, subtitle, dateRange, backgroundImage }: HeroProps) {
  return (
    <section className="hero relative min-h-screen flex flex-col justify-end">
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={`${basePath}${backgroundImage}`}
            alt="Atlantic Canada coastal landscape"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="hero-overlay relative z-10">
        <div className="article-container">
          <p className="byline font-medium mb-4" style={{ color: 'white' }}>{dateRange}</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-8 flex items-center gap-4 text-white/70">
            <span className="text-sm uppercase tracking-wider">By Nico, Dominic & Gretta</span>
            <span className="text-sm">•</span>
            <span className="text-sm">900 miles by bicycle</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <svg
          className="w-6 h-6 text-white/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
