'use client';

import React, { useState } from 'react';
import { useReader } from '@/hooks/useReader';
import { Star, Loader2 } from 'lucide-react';

export default function RatingsTab() {
  const { rateSeriesMutation, removeRating } = useReader();
  const [seriesId, setSeriesId] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesId.trim()) {
      alert('Please enter a series ID');
      return;
    }

    setIsSubmitting(true);
    try {
      await rateSeriesMutation.mutateAsync({
        seriesId,
        request: { value: rating },
      });
      setSeriesId('');
      setRating(5);
      alert('Rating submitted successfully!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRating = async (id: string) => {
    if (confirm('Remove this rating?')) {
      await removeRating.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Rate a Series</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Series ID</label>
            <input
              type="text"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              placeholder="Enter series ID (UUID)"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value as 1 | 2 | 3 | 4 | 5)}
                  className={`p-2 rounded-lg transition ${
                    rating === value
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  disabled={isSubmitting}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            Submit Rating
          </button>
        </form>
      </div>
    </div>
  );
}
