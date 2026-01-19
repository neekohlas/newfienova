'use client';

import { useState } from 'react';

interface AIContextNoteProps {
  title: string;
  content: string;
  noteId?: string;
}

export default function AIContextNote({ title, content }: AIContextNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const previewLength = 200;
  const needsExpansion = content.length > previewLength;

  // Get preview text (first ~200 chars, ending at word boundary)
  const getPreview = () => {
    if (!needsExpansion) return content;
    const truncated = content.slice(0, previewLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.slice(0, lastSpace) + '...';
  };

  return (
    <aside className="context-note my-8">
      <div className="context-note-header flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Historical Context
        </span>
      </div>
      <h4 className="font-bold text-stone-800 mb-2">{title}</h4>

      {isExpanded ? (
        <div className="text-stone-700 space-y-3">
          {paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      ) : (
        <p className="text-stone-700">{getPreview()}</p>
      )}

      {needsExpansion && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Read more
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
