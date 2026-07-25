'use client';

import { useEffect, useState } from 'react';
import { Layers, Plus, X, AlertCircle, Loader2, MessageSquare, Highlighter, Eye, MousePointerClick } from 'lucide-react';
import { mangaApi } from '@/services/manga-api';
import { fileApi } from '@/services/file-api';
import { PageResponse, AnnotationType, AnnotationResponse } from '@/types/manga';
import { usePageAnnotations } from '@/hooks/usePageAnnotations';

interface MangakaPageEditorTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaPageEditorTab({ triggerModal }: MangakaPageEditorTabProps) {
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visual Image URL state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Interactive Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Annotation form state
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationType, setAnnotationType] = useState<AnnotationType>('Other');
  const [annotationText, setAnnotationText] = useState('');
  const [annotationSubmitting, setAnnotationSubmitting] = useState(false);

  // Use annotation hook for selected page
  const { annotations, loading: annotationsLoading, createAnnotation, deleteAnnotation } =
    usePageAnnotations(selectedPageId);

  const loadPages = async (currentChapterId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getPages(currentChapterId);
      if (res.data?.success) {
        setPages(res.data.data || []);
      } else {
        setError(res.data?.message || "Unable to load pages.");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not reach manga service.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedChapterId = window.localStorage.getItem('manga-current-chapter-id');
    if (storedChapterId) {
      setChapterId(storedChapterId);
      void loadPages(storedChapterId);
    }
  }, []);

  // Fetch page image url when selected page changes
  useEffect(() => {
    setImageUrl(null);
    if (!selectedPageId) return;

    const pageObj = pages.find((p) => p.id === selectedPageId);
    if (pageObj?.fileId) {
      setImageLoading(true);
      fileApi
        .getFileUrl(pageObj.fileId)
        .then((res) => {
          if (res.data?.success && res.data.data?.url) {
            setImageUrl(res.data.data.url);
          }
        })
        .catch((err) => {
          console.error('Failed to load page image URL:', err);
        })
        .finally(() => {
          setImageLoading(false);
        });
    }
  }, [selectedPageId, pages]);
  const handleCreatePage = async (file: File) => {
    if (!chapterId) {
      triggerModal('Select a chapter first', 'Open the Chapters tab and pick a chapter before creating pages.');
      return;
    }

    try {
      setLoading(true);
      const upload = await fileApi.uploadFile(file, 'PageScan', { source: 'mangaka-page-editor' });
      const fileId = upload.data?.data?.fileId ?? upload.data?.data?.id;
      if (!upload.data?.success || !fileId) {
        throw new Error(upload.data?.message || 'The manuscript upload failed.');
      }
      const res = await mangaApi.createPage(chapterId, { pageNumber: pages.length + 1, fileId });
      if (res.data?.success) {
        triggerModal('Page Added', 'The manuscript was uploaded and linked to the new page.');
        void loadPages(chapterId);
      } else {
        triggerModal('Page Creation Failed', res.data?.message || 'The page could not be created.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      triggerModal('Page Upload Failed', error.response?.data?.message || (err instanceof Error ? err.message : 'The page could not be created.'));
    } finally {
      setLoading(false);
    }
  };

  // Drawing Canvas coordinates mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotationSubmitting || !imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentBox || !imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const width = Math.abs(startPos.x - currentX);
    const height = Math.abs(startPos.y - currentY);

    setCurrentBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !imageUrl) return;
    setIsDrawing(false);

    // Only open annotation form if selection box is large enough (avoid random clicks)
    if (currentBox && (currentBox.width > 1.5 || currentBox.height > 1.5)) {
      setShowAnnotationForm(true);
    } else {
      setCurrentBox(null);
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
      notes: `Added via visual page editor`,
      coordinatesJson: currentBox ? JSON.stringify(currentBox) : undefined,
    });

    setAnnotationSubmitting(false);

    if (success) {
      setAnnotationText('');
      setShowAnnotationForm(false);
      setCurrentBox(null);
      triggerModal('Annotation Added', 'Your annotation has been saved with coordinates.');
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
        return 'bg-blue-50/70 text-blue-700 border-blue-200';
      case 'highlight':
        return 'bg-amber-50/70 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-rose-50/70 text-rose-700 border-rose-200';
      case 'correction':
        return 'bg-purple-50/70 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50/70 text-slate-700 border-slate-200';
    }
  };

  const getAnnotationBorderColor = (type: AnnotationType) => {
    switch (type) {
      case 'comment':
        return 'border-blue-500 bg-blue-500/10';
      case 'highlight':
        return 'border-amber-500 bg-amber-500/10';
      case 'error':
        return 'border-rose-500 bg-rose-500/10';
      case 'correction':
        return 'border-purple-500 bg-purple-500/10';
      default:
        return 'border-slate-500 bg-slate-500/10';
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Visual Page Editor & Annotations</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Review layout files visually, click and drag to define coordinate boxes, and allocate task requirements.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-650 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-750 transition-colors">
          <Plus size={14} />
          Upload & Add Page
          <input
            aria-label="Upload manuscript page"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleCreatePage(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-150 bg-white p-8 flex items-center justify-center gap-3 shadow-sm">
          <Loader2 className="animate-spin text-slate-400" size={20} />
          <span className="text-sm text-slate-500">Loading pages…</span>
        </div>
      ) : error && pages.length === 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-6">
          <p className="text-sm text-rose-700 font-semibold">{error}</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm">
          <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No pages created yet</h3>
          <p className="text-sm text-slate-500 font-semibold mt-1.5 max-w-md mx-auto">
            Create your first page to start adding annotations and managing your layout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Page List */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Page List</h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 max-h-[500px] overflow-y-auto pr-1">
              {pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedPageId === page.id
                      ? 'border-indigo-500 bg-indigo-50/10 shadow-md ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      Page {page.pageNumber}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {page.status}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-650 min-h-16 flex items-center">
                    {page.fileId ? (
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">File Attached</p>
                        <p className="text-[10px] font-mono break-all text-indigo-600 font-semibold">{page.fileId}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-semibold italic">No canvas file attached yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Active Editor View */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPageId ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Visual Workspace Canvas (3/5 cols) */}
                <div className="md:col-span-3 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Visual Workspace</h3>
                  
                  {imageLoading ? (
                    <div className="aspect-[3/4] rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-indigo-500" size={24} />
                      <p className="text-xs text-slate-400 font-semibold">Loading page file...</p>
                    </div>
                  ) : imageUrl ? (
                    <div className="relative group/canvas">
                      {/* Interactive Selection area */}
                      <div
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 select-none cursor-crosshair bg-slate-900 shadow-lg"
                      >
                        {/* Page manuscript image */}
                        <img
                          src={imageUrl}
                          alt="Manuscript"
                          className="w-full h-full object-contain pointer-events-none"
                        />

                        {/* Existing saved annotations overlays */}
                        {annotations.map((annot) => {
                          if (!annot.coordinatesJson) return null;
                          try {
                            const box = JSON.parse(annot.coordinatesJson);
                            return (
                              <div
                                key={annot.id}
                                className={`absolute border-2 pointer-events-none rounded transition-all duration-300 ${getAnnotationBorderColor(
                                  (annot.type || 'comment') as AnnotationType
                                )}`}
                                style={{
                                  left: `${box.x}%`,
                                  top: `${box.y}%`,
                                  width: `${box.width}%`,
                                  height: `${box.height}%`,
                                }}
                              >
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-950/80 text-white font-mono leading-none border border-white/10 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                                  {annot.type}
                                </div>
                              </div>
                            );
                          } catch {
                            return null;
                          }
                        })}

                        {/* Active box drawing overlay */}
                        {isDrawing && currentBox && (
                          <div
                            className="absolute border-2 border-dashed border-indigo-400 bg-indigo-500/20 rounded pointer-events-none"
                            style={{
                              left: `${currentBox.x}%`,
                              top: `${currentBox.y}%`,
                              width: `${currentBox.width}%`,
                              height: `${currentBox.height}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                        <MousePointerClick size={12} className="text-indigo-500" />
                        <span>Click and drag on the image above to define an annotation box</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-250 bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center gap-2">
                      <Layers className="text-slate-300" size={32} />
                      <p className="text-xs font-bold text-slate-700">No Image Uploaded</p>
                      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed font-semibold">
                        This page has no attached canvas file. Upload an asset under the &quot;Files&quot; tab or attach a file to begin visual editing.
                      </p>
                    </div>
                  )}
                </div>

                {/* Annotation Controls Panel (2/5 cols) */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Page Notes</h3>
                    {imageUrl && (
                      <button
                        onClick={() => {
                          setShowAnnotationForm(!showAnnotationForm);
                          setCurrentBox(null);
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider"
                      >
                        {showAnnotationForm ? 'Cancel' : '+ Add Note'}
                      </button>
                    )}
                  </div>

                  {/* Add Annotation Form */}
                  {showAnnotationForm && (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200 text-slate-200">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                        {currentBox ? 'Selection Coordinates Captured' : 'Global Page Note'}
                      </p>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                          Type
                        </label>
                        <select
                          value={annotationType}
                          onChange={(e) => setAnnotationType(e.target.value as AnnotationType)}
                          className="w-full text-xs font-semibold bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="comment">💬 Comment</option>
                          <option value="highlight">🔆 Highlight</option>
                          <option value="error">❌ Error</option>
                          <option value="correction">✏️ Correction</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                          Description
                        </label>
                        <textarea
                          value={annotationText}
                          onChange={(e) => setAnnotationText(e.target.value)}
                          placeholder="What needs to be done here?"
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500 resize-none h-20 text-slate-100"
                        />
                      </div>

                      <button
                        onClick={handleAddAnnotation}
                        disabled={annotationSubmitting || !annotationText.trim()}
                        className="w-full text-xs font-bold text-white bg-indigo-750 hover:bg-indigo-850 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors shadow-md"
                      >
                        {annotationSubmitting ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>
                  )}

                  {/* Annotations List */}
                  <div className="space-y-2">
                    {annotationsLoading ? (
                      <div className="flex items-center justify-center gap-2 p-6">
                        <Loader2 className="animate-spin text-slate-400" size={16} />
                        <span className="text-xs text-slate-500">Loading notes...</span>
                      </div>
                    ) : annotations.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs border border-slate-100 bg-slate-50/30 rounded-xl font-semibold">
                        <MessageSquare size={20} className="mx-auto mb-2 text-slate-300" />
                        No annotations yet. Define boxes on canvas or add comments.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {annotations.map((annotation: AnnotationResponse) => (
                          <div
                            key={annotation.id}
                            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-sm transition-all hover:shadow ${getAnnotationTypeColor(
                              (annotation.type || 'comment') as AnnotationType
                            )}`}
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <div className="mt-0.5 shrink-0">
                                {getAnnotationTypeIcon((annotation.type || 'comment') as AnnotationType)}
                              </div>
                              <div className="flex-1 text-xs min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="font-extrabold capitalize leading-none">{annotation.type || 'Comment'}</p>
                                  {annotation.coordinatesJson && (
                                    <span className="text-[9px] font-mono font-bold bg-slate-950/5 px-1.5 py-0.5 rounded leading-none">
                                      Coord
                                    </span>
                                  )}
                                </div>
                                <p className="leading-relaxed font-medium break-words text-slate-700 mt-1">
                                  {annotation.description || annotation.notes || 'No description provided.'}
                                </p>
                                {annotation.createdAt && (
                                  <p className="text-[9px] font-semibold opacity-65 mt-1.5 font-mono">
                                    {new Date(annotation.createdAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteAnnotation(annotation.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors shrink-0 p-0.5 hover:bg-white rounded-md border border-transparent hover:border-slate-100"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mb-4">
                  <Eye size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Select a Page</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1 max-w-sm">
                  Choose a page from the left-hand sidebar list to inspect annotations, review coordinate boundaries, or write revisions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
