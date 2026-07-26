'use client';

import React, { useState } from 'react';
import { useReader } from '@/hooks/useReader';
import { MessageCircle, Loader2, Trash2 } from 'lucide-react';

export default function CommentsTab() {
  const { addSeriesComment, useSeriesComments, updateComment, deleteComment } = useReader();
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments = [] } = useSeriesComments(selectedSeriesId);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId.trim() || !commentContent.trim()) {
      alert('Please enter series ID and comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSeriesComment.mutateAsync({
        seriesId: selectedSeriesId,
        request: { content: commentContent },
      });
      setCommentContent('');
      alert('Comment added successfully!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (confirm('Delete this comment?')) {
      await deleteComment.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Add Comment</h3>
        <form onSubmit={handleAddComment} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Series ID</label>
            <input
              type="text"
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              placeholder="Enter series ID (UUID)"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Comment</label>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Share your thoughts..."
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:outline-none disabled:opacity-50 resize-none"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            Post Comment
          </button>
        </form>
      </div>

      {comments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-100">Comments ({comments.length})</h3>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs text-slate-400">User ID</p>
                  <p className="text-slate-200 text-sm truncate">{comment.userId}</p>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deleteComment.isPending}
                  className="ml-2 text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-slate-300 mb-2">{comment.content}</p>
              <p className="text-xs text-slate-500">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedSeriesId && comments.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No comments yet for this series.</p>
        </div>
      )}
    </div>
  );
}
