'use client';

import React, { useState } from 'react';
import { X, Users, TrendingUp } from 'lucide-react';
import { SeriesResponse } from '@/types/manga';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  series: SeriesResponse[];
  onSubmit: (seriesId: string, voteCount: number) => Promise<boolean>;
  issueId: string;
}

export default function ReaderVoteInputDialog({
  isOpen,
  onClose,
  series,
  onSubmit,
  issueId,
}: Props) {
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [voteCount, setVoteCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId || !voteCount || !issueId) {
      setError('Please select a series and enter vote count.');
      return;
    }

    const count = Number(voteCount);
    if (count < 0) {
      setError('Vote count cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const success = await onSubmit(selectedSeriesId, count);
    setIsSubmitting(false);

    if (success) {
      setSelectedSeriesId('');
      setVoteCount('');
      onClose();
    } else {
      setError('Failed to save reader vote. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedSeriesId('');
      setVoteCount('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Input Reader Vote</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter vote counts for this issue</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-semibold">
              {error}
            </div>
          )}

          {/* Series Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Select Series <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            >
              <option value="">Choose a series...</option>
              {series.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          {/* Vote Count Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Vote Count <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <TrendingUp size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="0"
                step="1"
                value={voteCount}
                onChange={(e) => setVoteCount(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Enter number of votes"
                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 font-semibold">
              Total number of reader votes for this series in the selected issue
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSeriesId || !voteCount}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Vote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
