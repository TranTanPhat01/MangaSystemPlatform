import React, { useEffect, useState } from 'react';
import { mangaApi } from '@/services/manga-api';
import { ChapterResponse, SeriesResponse } from '@/types/manga';

interface MangakaChaptersTabProps {
  series: SeriesResponse[];
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaChaptersTab({ series, triggerModal }: MangakaChaptersTabProps) {
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (series.length > 0) {
      const firstSeriesId = series[0].id;
      setSelectedSeriesId(firstSeriesId);
      void loadChapters(firstSeriesId);
    }
  }, [series]);

  const loadChapters = async (seriesId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getChapters(seriesId);
      if (res.data?.success) {
        setChapters(res.data.data || []);
      } else {
        setError(res.data?.message || 'Unable to load chapters.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not reach manga service.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (chapterId: string) => {
    try {
      const res = await mangaApi.submitChapterForReview(chapterId);
      if (res.data?.success) {
        triggerModal('Chapter Submitted', 'The chapter was sent for review successfully.');
        if (selectedSeriesId) {
          void loadChapters(selectedSeriesId);
        }
      } else {
        triggerModal('Submission Failed', res.data?.message || 'The chapter could not be submitted.');
      }
    } catch (err: any) {
      triggerModal('Submission Failed', err.response?.data?.message || 'The review submission failed.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 font-sans">Chapter Release Management</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Track editorial reviews, storyboarding, script status, and release phases.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-150 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Filter Series:</span>
          <select
            value={selectedSeriesId}
            onChange={(e) => {
              setSelectedSeriesId(e.target.value);
              void loadChapters(e.target.value);
            }}
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
          >
            {series.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading chapters…</div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600">{error}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {chapters.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No chapters available for this series yet.</div>
            ) : chapters.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/40">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded bg-burgundy-50 border border-burgundy-100 flex items-center justify-center font-mono font-bold text-burgundy-900 text-xs shrink-0">
                    {item.chapterNumber}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Chapter {item.chapterNumber}: {item.title || 'Untitled'}</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Status: {item.status} • Progress: {item.progressPercentage ?? 0}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {item.status}
                  </span>
                  <button
                    onClick={() => handleSubmitReview(item.id)}
                    className="text-xs font-bold text-burgundy-855 hover:text-burgundy-950 px-2 py-1 rounded bg-burgundy-50/50 hover:bg-burgundy-100/50 transition-colors"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
