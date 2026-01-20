'use client';

import { useState, useEffect } from 'react';

interface Post {
  id: string;
  title: string;
  shortDate: string;
}

interface NavigationProps {
  posts: Post[];
}

export default function Navigation({ posts }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);

      // Find which post is currently in view
      const postElements = document.querySelectorAll('[id^="post-"]');
      let currentPost: string | null = null;

      postElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 200) {
          currentPost = el.id.replace('post-', '');
        }
      });

      if (currentPost) {
        setActivePostId(currentPost);
      }
    };

    // Handle initial hash navigation on page load
    const handleInitialHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#post-')) {
        const postId = hash.replace('#post-', '');
        // Wait for initial render
        setTimeout(() => {
          const titleElement = document.getElementById(`title-${postId}`);
          if (titleElement) {
            const headerOffset = 80;
            const elementPosition = titleElement.getBoundingClientRect().top;
            const targetPosition = elementPosition + window.scrollY - headerOffset;
            const scrollDistance = Math.abs(targetPosition);

            // Smooth scroll for the visual journey
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });

            // Correct position after scroll completes
            if (scrollDistance > 1500) {
              const estimatedDuration = Math.min(Math.max(scrollDistance / 3, 500), 1500);
              setTimeout(() => {
                const newElementPosition = titleElement.getBoundingClientRect().top;
                const adjustment = newElementPosition - headerOffset;
                if (Math.abs(adjustment) > 50) {
                  window.scrollTo({
                    top: window.scrollY + adjustment,
                    behavior: 'smooth'
                  });
                }
              }, estimatedDuration + 100);
            }
          }
        }, 300);
      }
    };

    handleInitialHash();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPost = (postId: string) => {
    setIsMenuOpen(false);

    // Update the URL hash
    window.history.pushState(null, '', `#post-${postId}`);

    const titleElement = document.getElementById(`title-${postId}`);
    if (!titleElement) return;

    const headerOffset = 80;
    const elementPosition = titleElement.getBoundingClientRect().top;
    const currentScroll = window.scrollY;
    const targetPosition = elementPosition + currentScroll - headerOffset;
    const scrollDistance = Math.abs(targetPosition - currentScroll);

    // Start smooth scroll for the visual journey
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // For long scrolls, correct the position after scroll completes
    // (lazy-loaded images may have shifted the layout)
    if (scrollDistance > 1500) {
      // Estimate scroll duration based on distance (roughly 1ms per 3px, capped)
      const estimatedDuration = Math.min(Math.max(scrollDistance / 3, 500), 1500);

      setTimeout(() => {
        // Recalculate and snap to correct position
        const newElementPosition = titleElement.getBoundingClientRect().top;
        const adjustment = newElementPosition - headerOffset;

        // Only adjust if we're off by more than 50px
        if (Math.abs(adjustment) > 50) {
          window.scrollTo({
            top: window.scrollY + adjustment,
            behavior: 'smooth'
          });
        }
      }, estimatedDuration + 100);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Fixed Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo/Title */}
          <button
            onClick={scrollToTop}
            className={`font-bold transition-colors ${
              isScrolled ? 'text-stone-900' : 'text-white'
            }`}
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Maritime Biking
          </button>

          {/* Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
              isScrolled
                ? 'text-stone-700 hover:bg-stone-100'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <span>Jump to entry</span>
            <svg
              className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-14 right-4 z-50 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-lg shadow-xl border border-stone-200">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Journal Entries
              </div>
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => scrollToPost(post.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activePostId === post.id
                      ? 'bg-amber-100 text-amber-900'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span className="text-stone-400 text-xs mr-2">{post.shortDate}</span>
                  <span className="line-clamp-1">{post.title}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
