'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Plus, X, AlertCircle, Loader2, MessageSquare, Highlighter } from 'lucide-react';
import { mangaApi } from '@/services/manga-api';
import { PageResponse } from '@/types/manga';
import { usePageAnnotations } from '@/hooks/usePageAnnotations';

interface MangakaPageEditorEnhancedTabProps {
  setActiveTab: (tab: string) => void;
  triggerModal: (title: string, content: string) => void;
}

type AnnotationType = 'comment' | 'highlight' | 'error' | 'correction';

export default function MangakaPageEditorEnhancedTab({
  setActiveTab,
  triggerModal,
}: MangakaPageEditorEnhancedTabProps) {
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Annotation form state
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationType, setAnnotationType] = useState<AnnotationType>('comment');
  const [annotationText, setAnnotationText] = useState('');
  const [annotationSubmitting, setAnnotationSubmitting] = useState(false);

  // Use annotation hook for selected page
  const { annotations, loading: annotationsLoading, createAnnotation, deleteAnnotation } =
    usePageAnnotations(selectedPageId);

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

  const handleAddAnnotation = async () => {
    if (!selectedPageId || !annotationText.trim()) {
      setError('Please enter annotation text.');
      return;
    }

    setAnnotationSubmitting(true);
    const success = await createAnnotation({
      type: annotationType,
      description: annotationText.trim(),
      notes: `Added via page editor`,
    });

    setAnnotationSubmitting(false);

    if (success) {
      setAnnotationText('');
      setShowAnnotationForm(false);
      triggerModal('Annotation Added', 'Your annotation has been saved to this page.');
    } else {
      setError('Failed to create annotation.');
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!window.confirm('Delete this annotation?')) return;
    const success = await deleteAnnotation(annotationId);
    if (success) {
      triggerModal('Annotation Deleted', 'The annotation has been removed.');
    }
  };

  const getAnnotationTypeColor = (type: AnnotationType) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'highlight':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'correction':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getAnnotationTypeIcon = (type: AnnotationType) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={14} />;
      case 'highlight':
        return <Highlighter size={14} />;
      case 'error':
        return <AlertCircle size={14} />;
      case 'correction':
        return <Plus size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Visual Page Editor & Annotations</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Review pages, add annotations, manage feedback, and organize sequences.
          </p>
        </div>
        <button
          onClick={handleCreatePage}
          className="inline-flex items-center gap-2 rounded-lg bg-burgundy-850 px-3 py-2 text-xs font-bold text-white hover:bg-burgundy-950 transition-colors"
        >
          <Plus size={14} />
          Add Page
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-150 bg-white p-8 flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-slate-400" size={20} />
          <span className="text-sm text-slate-500">Loading pages…</span>
        </div>
      ) : error && pages.length === 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm text-rose-700 font-semibold">{error}</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm">
          <div className="h-16 w-16 bg-plum-50 border border-plum-100 text-plum-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No pages created yet</h3>
          <p className="text-sm text-slate-500 font-semibold mt-1.5 max-w-md mx-auto">
            Create your first page to start adding annotations and managing your layout.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Page List */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => (
              <div
                key={page.id}
                onClick={() => setSelectedPageId(page.id)}
                className={`rounded-xl border-2 p-4 shadow-sm cursor-pointer transition-all ${
                  selectedPageId === page.id
                    ? 'border-burgundy-500 bg-burgundy-50/20 shadow-md'
                    : 'border-slate-150 bg-white hover:border-slate-200'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Page {page.pageNumber}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {page.status}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600 mb-3 min-h-20">
                  {page.fileId ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Asset ID:</p>
                      <p className="text-[10px] font-mono break-all">{page.fileId}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No file attached yet.</p>
                  )}
                </div>

                {/* Annotation count badge */}
                {annotations.length > 0 && selectedPageId === page.id && (
                  <div className="text-[10px] font-bold text-burgundy-700 bg-burgundy-100 px-2 py-1 rounded">
                    {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Annotation Panel */}
          {selectedPageId && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare size={18} className="text-burgundy-600" />
                  Page Annotations
                </h3>
                <button
                  onClick={() => setShowAnnotationForm(!showAnnotationForm)}
                  className="text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-950 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {showAnnotationForm ? 'Cancel' : '+ Add Note'}
                </button>
              </div>

              {/* Add Annotation Form */}
              {showAnnotationForm && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Annotation Type
                    </label>
                    <select
                      value={annotationType}
                      onChange={(e) => setAnnotationType(e.target.value as AnnotationType)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-burgundy-400"
                    >
                      <option value="comment">💬 Comment</option>
                      <option value="highlight">🔆 Highlight</option>
                      <option value="error">❌ Error</option>
                      <option value="correction">✏️ Correction</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Notes
                    </label>
                    <textarea
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="Enter your annotation..."
                      className="w-full text-xs border border-slate-200 rounded px-2 py-2 focus:outline-none focus:border-burgundy-400 resize-none h-20"
                    />
                  </div>

                  <button
                    onClick={handleAddAnnotation}
                    disabled={annotationSubmitting}
                    className="w-full text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-950 disabled:opacity-50 px-3 py-2 rounded transition-colors"
                  >
                    {annotationSubmitting ? 'Saving...' : 'Save Annotation'}
                  </button>
                </div>
              )}

              {/* Annotations List */}
              {annotationsLoading ? (
                <div className="flex items-center justify-center gap-2 p-4">
                  <Loader2 className="animate-spin text-slate-400" size={16} />
                  <span className="text-xs text-slate-500">Loading annotations...</span>
                </div>
              ) : annotations.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  <MessageSquare size={20} className="mx-auto mb-2 text-slate-300" />
                  No annotations yet. Add one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${getAnnotationTypeColor(
                        (annotation.type || 'comment') as AnnotationType
                      )}`}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <div className="mt-0.5">{getAnnotationTypeIcon((annotation.type || 'comment') as AnnotationType)}</div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold capitalize mb-0.5">{annotation.type || 'Comment'}</p>
                          <p className="leading-relaxed">{annotation.description || annotation.notes || 'No details'}</p>
                          {annotation.createdAt && (
                            <p className="text-[10px] opacity-70 mt-1">
                              {new Date(annotation.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnotation(annotation.id)}
                        className="text-[10px] font-bold opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
