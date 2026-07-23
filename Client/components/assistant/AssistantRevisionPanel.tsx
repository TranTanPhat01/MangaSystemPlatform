'use client';

import React from 'react';
import { AlertCircle, Loader2, Clock } from 'lucide-react';
import { useAssistantRevisions } from '@/hooks/useAssistantRevisions';

export default function AssistantRevisionPanel() {
  const { revisions, loading, error, fetchRevisions } = useAssistantRevisions();

  if (loading) {
    return (
      <section className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-slate-400" size={24} />
          <p className="ml-3 text-slate-500">Loading revision requests...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="text-rose-600 flex-shrink-0" size={16} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button
              onClick={() => void fetchRevisions()}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 mt-2 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {revisions.length === 0 ? (
        <div className="text-center py-8">
          <Clock size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-semibold">No revision requests</p>
          <p className="text-sm text-slate-500 mt-1">Great! All your submissions have been approved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Active Revision Requests</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {revisions.length}
            </span>
          </div>
          
          {revisions.map((revision) => (
            <div
              key={revision.taskId}
              className="bg-slate-50 border border-slate-150 rounded-lg p-4 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {revision.chapterInfo} - Page {revision.pageNumber}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Requested: {revision.requestedDate}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-700 bg-white border border-slate-200 rounded p-2 italic">
                "{revision.reason}"
              </p>
              <button
                className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                View Details & Resubmit
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
