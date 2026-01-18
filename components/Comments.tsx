'use client';

import { useState } from 'react';

interface Comment {
  author: string;
  date: string;
  text: string;
}

interface CommentsProps {
  comments: Comment[];
}

export default function Comments({ comments }: CommentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 border-t border-stone-200 pt-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 text-stone-600 hover:text-stone-900 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold" style={{ fontFamily: 'var(--font-display), Georgia, serif' }}>
            {comments.length} Comment{comments.length !== 1 ? 's' : ''} from 2008
          </span>
        </div>
        <span className="text-sm text-stone-400 group-hover:text-stone-500">
          {isExpanded ? 'Click to collapse' : 'Click to read'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {comments.map((comment, idx) => (
            <div key={idx} className="py-2">
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className="font-semibold text-stone-700 text-sm"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  {comment.author}
                </span>
                <span className="text-xs text-stone-400">
                  {comment.date}
                </span>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">
                {comment.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
