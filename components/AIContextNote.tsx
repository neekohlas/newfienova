'use client';

import { useState, useEffect } from 'react';

interface AIContextNoteProps {
  title: string;
  content: string;
  noteId?: string;
}

interface Feedback {
  id: string;
  text: string;
  timestamp: string;
}

export default function AIContextNote({ title, content, noteId }: AIContextNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [savedFeedback, setSavedFeedback] = useState<Feedback[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Generate a stable ID for this note
  const id = noteId || `note-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50)}`;

  // Load saved feedback from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(`ai-feedback-${id}`);
    if (stored) {
      try {
        setSavedFeedback(JSON.parse(stored));
      } catch {
        setSavedFeedback([]);
      }
    }
  }, [id]);

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

  const saveFeedback = () => {
    if (!feedbackText.trim()) return;

    const newFeedback: Feedback = {
      id: Date.now().toString(),
      text: feedbackText.trim(),
      timestamp: new Date().toLocaleString(),
    };

    const updated = [...savedFeedback, newFeedback];
    setSavedFeedback(updated);
    localStorage.setItem(`ai-feedback-${id}`, JSON.stringify(updated));
    setFeedbackText('');
  };

  const deleteFeedback = (feedbackId: string) => {
    const updated = savedFeedback.filter(f => f.id !== feedbackId);
    setSavedFeedback(updated);
    if (updated.length === 0) {
      localStorage.removeItem(`ai-feedback-${id}`);
    } else {
      localStorage.setItem(`ai-feedback-${id}`, JSON.stringify(updated));
    }
  };

  const clearAllFeedback = () => {
    setSavedFeedback([]);
    localStorage.removeItem(`ai-feedback-${id}`);
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
        {isMounted && savedFeedback.length > 0 && (
          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
            {savedFeedback.length} note{savedFeedback.length !== 1 ? 's' : ''}
          </span>
        )}
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

      <div className="flex items-center gap-4 mt-3">
        {needsExpansion && (
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
        )}

        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="text-sm font-medium text-stone-500 hover:text-stone-700 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {showFeedback ? 'Hide feedback' : 'Leave feedback'}
        </button>
      </div>

      {/* Feedback Section */}
      {showFeedback && isMounted && (
        <div className="mt-4 pt-4 border-t border-stone-300">
          {/* Existing feedback */}
          {savedFeedback.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Your Notes
                </span>
                <button
                  onClick={clearAllFeedback}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear all
                </button>
              </div>
              {savedFeedback.map(feedback => (
                <div
                  key={feedback.id}
                  className="bg-white/50 rounded p-3 text-sm relative group"
                >
                  <button
                    onClick={() => deleteFeedback(feedback.id)}
                    className="absolute top-2 right-2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="text-stone-700 pr-6">{feedback.text}</p>
                  <p className="text-xs text-stone-400 mt-1">{feedback.timestamp}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add new feedback */}
          <div className="flex gap-2">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Add a note about this section (e.g., corrections, suggestions, personal memories)..."
              className="flex-1 text-sm p-2 border border-stone-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={2}
            />
            <button
              onClick={saveFeedback}
              disabled={!feedbackText.trim()}
              className="self-end px-3 py-2 bg-stone-700 text-white text-sm rounded hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Notes are saved locally in your browser and can be cleared anytime.
          </p>
        </div>
      )}
    </aside>
  );
}
