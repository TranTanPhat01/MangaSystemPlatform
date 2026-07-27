'use client';

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import EditorialFeedbackCard from './EditorialFeedbackCard';
import { useMangakaEditorial } from '@/hooks/useMangakaEditorial';

interface MangakaEditorialTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaEditorialTab({ triggerModal }: MangakaEditorialTabProps) {
  const { reviews, loading, error, fetchEditorialFeedback } = useMangakaEditorial();

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-350">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editorial Feedback Log</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Review feedback, requested changes, and direct communication history with editor.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={24} />
          <p className="ml-3 text-slate-500">Loading editorial feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Editorial Feedback Log</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Review feedback, requested changes, and direct communication history with editor.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-rose-600 flex-shrink-0" size={16} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button
              onClick={() => void fetchEditorialFeedback()}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 mt-2 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-xl p-8 text-center shadow-sm">
          <p className="text-slate-600 font-semibold">No editorial feedback yet.</p>
          <p className="text-sm text-slate-500 mt-1">Submit a chapter to receive feedback from editors.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((feedback) => (
            <EditorialFeedbackCard
              key={feedback.reviewId}
              chapter={feedback.chapterTitle}
              editorName={feedback.editorName || 'Unassigned'}
              status={feedback.status}
              note={feedback.note}
              onViewFeedback={() =>
                triggerModal(
                  `Editorial Feedback: ${feedback.chapterTitle}`,
                  feedback.comments.length > 0
                    ? `${feedback.comments.map(c => c.commentText).join('\n\n')}`
                    : feedback.note || 'No detailed feedback provided yet.'
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
