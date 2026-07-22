import React, { useEffect, useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { mangaApi } from '@/services/manga-api';
import { PageResponse } from '@/types/manga';

interface MangakaPageEditorTabProps {
  setActiveTab: (tab: string) => void;
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaPageEditorTab({ setActiveTab, triggerModal }: MangakaPageEditorTabProps) {
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedChapterId = window.localStorage.getItem('manga-current-chapter-id');
    if (storedChapterId) {
      setChapterId(storedChapterId);
      void loadPages(storedChapterId);
    }
  }, []);

  const loadPages = async (currentChapterId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getPages(currentChapterId);
      if (res.data?.success) {
        setPages(res.data.data || []);
      } else {
        setError(res.data?.message || 'Unable to load pages.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not reach manga service.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!chapterId) {
      triggerModal('Select a chapter first', 'Open the Chapters tab and pick a chapter before creating pages.');
      return;
    }

    try {
      const res = await mangaApi.createPage(chapterId, { pageNumber: pages.length + 1 });
      if (res.data?.success) {
        triggerModal('Page Created', 'A new page record was created for the selected chapter.');
        void loadPages(chapterId);
      } else {
        triggerModal('Page Creation Failed', res.data?.message || 'The page could not be created.');
      }
    } catch (err: any) {
      triggerModal('Page Creation Failed', err.response?.data?.message || 'The page could not be created.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Visual Page Editor & Sequence Manager</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Review drawing bounds, panels layout, dialog box pacing, and arrange page sequences.</p>
        </div>
        <button
          onClick={handleCreatePage}
          className="inline-flex items-center gap-2 rounded-lg bg-burgundy-850 px-3 py-2 text-xs font-bold text-white"
        >
          <Plus size={14} />Add Page
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-150 bg-white p-6 text-sm text-slate-500">Loading pages…</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      ) : pages.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm">
          <div className="h-16 w-16 bg-plum-50 border border-plum-100 text-plum-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No page workspace yet</h3>
          <p className="text-sm text-slate-500 font-semibold mt-1.5 max-w-md mx-auto">
            Create a page record for the current chapter and the editor can be used for layout and annotation review.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <div key={page.id} className="rounded-xl border border-slate-150 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Page {page.pageNumber}</span>
                <span className="text-[10px] font-semibold text-slate-500">{page.status}</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                {page.fileId ? `Attached asset ID: ${page.fileId}` : 'No file attached yet.'}
              </div>
              <button
                onClick={() => triggerModal(`Page ${page.pageNumber}`, 'The page editor can now be connected to annotation and asset review flows.')}
                className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Open Review Notes
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
