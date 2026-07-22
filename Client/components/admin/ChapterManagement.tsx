'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  Trash2,
  FileImage,
  ExternalLink
} from 'lucide-react';
import { adminApi } from '@/services/admin-api';
import { fileApi } from '@/services/file-api';
import { ChapterResponse, PageResponse } from '@/types/manga';

interface ChapterManagementProps {
  seriesId: string;
  seriesTitle: string;
  onChapterPublished?: () => void;
}

export function ChapterManagement({ seriesId, seriesTitle, onChapterPublished }: ChapterManagementProps) {
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterResponse | null>(null);
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);

  // Forms state
  const [newChapterNumber, setNewChapterNumber] = useState<number>(1);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminApi.getChapters(seriesId);
      if (res.data.success) {
        // Safe mapping backend enum status code to string status code
        const statusMap: Record<number, string> = {
          1: 'Draft',
          2: 'InProduction',
          3: 'SubmittedForReview',
          4: 'RevisionRequired',
          5: 'Approved',
          6: 'Scheduled',
          7: 'Published',
          8: 'Rejected'
        };
        const mapped = res.data.data.map((c: any) => ({
          ...c,
          status: statusMap[c.status] || 'Draft'
        }));
        setChapters(mapped);
        
        // Auto increment chapter number suggest
        if (mapped.length > 0) {
          const maxNum = Math.max(...mapped.map((c: any) => c.chapterNumber));
          setNewChapterNumber(maxNum + 1);
        } else {
          setNewChapterNumber(1);
        }
      } else {
        setErrorMsg(res.data.message || 'Failed to fetch chapters list.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Could not load chapters list.');
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  const fetchPages = useCallback(async (chapterId: string) => {
    setPagesLoading(true);
    try {
      const res = await adminApi.getChapterPages(chapterId);
      if (res.data.success) {
        setPages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pages for chapter', err);
    } finally {
      setPagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (seriesId) {
      fetchChapters();
      setSelectedChapter(null);
      setPages([]);
    }
  }, [seriesId, fetchChapters]);

  useEffect(() => {
    if (selectedChapter) {
      fetchPages(selectedChapter.id);
    }
  }, [selectedChapter, fetchPages]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Chapter Creation
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    setIsCreatingChapter(true);
    setErrorMsg(null);
    try {
      const res = await adminApi.createChapter(seriesId, {
        chapterNumber: newChapterNumber,
        title: newChapterTitle.trim()
      });
      if (res.data.success) {
        triggerSuccess(`Chapter ${newChapterNumber} created successfully.`);
        setNewChapterTitle('');
        fetchChapters();
      } else {
        triggerError(res.data.message || 'Failed to create chapter.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to create chapter.');
    } finally {
      setIsCreatingChapter(false);
    }
  };

  // Publish Chapter
  const handlePublishChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to publish this chapter? It will become visible to readers.')) return;
    setActionLoading(chapterId);
    setErrorMsg(null);
    try {
      const res = await adminApi.publishChapter(chapterId);
      if (res.data.success) {
        triggerSuccess('Chapter published successfully!');
        fetchChapters();
        if (selectedChapter?.id === chapterId) {
          setSelectedChapter(prev => prev ? { ...prev, status: 'Published' } : null);
        }
        if (onChapterPublished) onChapterPublished();
      } else {
        triggerError(res.data.message || 'Failed to publish chapter.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to publish chapter.');
    } finally {
      setActionLoading(null);
    }
  };

  // Page upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedChapter) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setErrorMsg(null);
    try {
      // Axios upload file with progress
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'PageScan');
      
      const uploadRes = await fileApi.uploadFile(file, 'PageScan');
      if (uploadRes.data.success) {
        const fileAsset = uploadRes.data.data;
        
        // Link to page entity in chapter
        const pageNumber = pages.length + 1;
        const pageRes = await adminApi.createPage(selectedChapter.id, {
          pageNumber,
          fileId: fileAsset.fileId
        });
        
        if (pageRes.data.success) {
          triggerSuccess(`Page ${pageNumber} uploaded and associated successfully.`);
          fetchPages(selectedChapter.id);
        } else {
          triggerError(pageRes.data.message || 'Failed to register page entity.');
        }
      } else {
        triggerError(uploadRes.data.message || 'Failed to upload page file.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to upload manuscript page.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert banners */}
      <div className="space-y-2">
        {errorMsg && (
          <div className="flex items-start justify-between p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-450 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-450 hover:text-rose-350">X</button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-450 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-455 hover:text-emerald-350">X</button>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" />
            Chapters of &ldquo;{seriesTitle}&rdquo;
          </h2>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Manage serialization issues, upload drafts, and publish.</p>
        </div>

        {/* Create Chapter Form */}
        <form onSubmit={handleCreateChapter} className="flex gap-2 p-3 bg-slate-950/40 border border-slate-850 rounded-lg">
          <div className="w-16">
            <input
              type="number"
              min={1}
              required
              disabled={isCreatingChapter}
              value={newChapterNumber}
              onChange={(e) => setNewChapterNumber(Number(e.target.value))}
              placeholder="No"
              className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              required
              disabled={isCreatingChapter}
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter Title..."
              className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={isCreatingChapter || !newChapterTitle.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-750 hover:bg-indigo-850 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            <Plus size={13} /> Add
          </button>
        </form>

        {/* Chapter List */}
        {loading && chapters.length === 0 ? (
          <div className="py-8 text-center text-slate-655 text-xs">
            <RefreshCw className="animate-spin h-5 w-5 text-indigo-500 mx-auto mb-2" />
            Loading chapters...
          </div>
        ) : chapters.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-xs font-semibold border border-dashed border-slate-800 rounded-lg">
            No chapters registered for this series.
          </div>
        ) : (
          <div className="space-y-2">
            {chapters.map((ch) => {
              const isSelected = selectedChapter?.id === ch.id;
              const isPublished = ch.status === 'Published';
              
              return (
                <div 
                  key={ch.id} 
                  onClick={() => setSelectedChapter(ch)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected 
                      ? 'bg-slate-950/60 border-indigo-500/30' 
                      : 'bg-slate-950/20 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-250">
                        Ch {ch.chapterNumber}: {ch.title || 'Untitled'}
                      </h4>
                      <p className="text-[9px] text-slate-600 font-semibold font-mono mt-0.5">
                        Created: {new Date(ch.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        isPublished 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {ch.status}
                      </span>
                      {!isPublished && (
                        <button
                          onClick={() => handlePublishChapter(ch.id)}
                          disabled={actionLoading === ch.id}
                          className="px-2 py-0.5 bg-emerald-600/15 hover:bg-emerald-600/20 text-emerald-450 border border-emerald-650/20 rounded text-[9px] font-bold transition-all"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Chapter pages administration */}
                  {isSelected && (
                    <div className="mt-2 border-t border-slate-850 pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileImage size={12} className="text-indigo-400" />
                        Manuscript pages ({pages.length})
                      </div>

                      {/* Pages List */}
                      {pagesLoading ? (
                        <div className="py-2 text-[10px] text-slate-600 font-semibold flex items-center gap-2">
                          <RefreshCw size={10} className="animate-spin text-indigo-500" />
                          Fetching scan list...
                        </div>
                      ) : pages.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic font-semibold">No manuscript pages uploaded yet.</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {pages.map((page) => (
                            <div key={page.id} className="relative bg-slate-950 border border-slate-850 p-2 rounded flex flex-col items-center justify-between text-center group">
                              <FileText size={18} className="text-slate-500 mb-1" />
                              <span className="font-bold text-[9px] text-slate-400 font-mono">Page {page.pageNumber}</span>
                              {page.fileAssetId && (
                                <a 
                                  href={`http://localhost:5200/files/${page.fileAssetId}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Download Page Asset"
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-opacity"
                                >
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload new page button */}
                      <div className="pt-1">
                        {uploading ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                              <span>Uploading Scan...</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-indigo-500 h-full animate-pulse" style={{ width: '100%' }} />
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-950 border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer transition-colors">
                            <Upload size={12} />
                            Upload Manuscript Scan
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden" 
                              onChange={handleFileUpload}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default ChapterManagement;
