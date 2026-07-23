'use client';

import React, { useState } from 'react';
import { useReader } from '@/hooks/useReader';
import { Clock, Loader2, Trash2, AlertCircle } from 'lucide-react';

export default function HistoryTab() {
  const { history, historyLoading, clearHistory } = useReader();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearHistory = async () => {
    if (confirm('Clear all reading history? This cannot be undone.')) {
      setIsClearing(true);
      try {
        await clearHistory.mutateAsync();
      } finally {
        setIsClearing(false);
      }
    }
  };

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No reading history yet. Start reading!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleClearHistory}
          disabled={isClearing}
          className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 border border-red-700 rounded-lg hover:bg-red-900/30 disabled:opacity-50 transition"
        >
          <Trash2 className="h-4 w-4" />
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-400">Series ID</p>
                <p className="text-slate-200 font-medium text-sm truncate">{item.seriesId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Chapter ID</p>
                <p className="text-slate-200 font-medium text-sm truncate">{item.chapterId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Page ID</p>
                <p className="text-slate-200 font-medium text-sm truncate">{item.pageId || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Last Read</p>
                <p className="text-slate-200 text-sm">
                  {new Date(item.lastReadAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
