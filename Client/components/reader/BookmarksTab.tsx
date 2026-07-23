'use client';

import React from 'react';
import { useReader } from '@/hooks/useReader';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';

export default function BookmarksTab() {
  const { bookmarks, bookmarksLoading, removeBookmark } = useReader();

  const handleRemove = async (id: string) => {
    if (confirm('Remove this bookmark?')) {
      await removeBookmark.mutateAsync(id);
    }
  };

  if (bookmarksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No bookmarks yet. Add bookmarks while reading!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-400">Chapter ID</p>
                <p className="text-slate-200 font-medium truncate text-sm">{bookmark.chapterId}</p>
                {bookmark.pageId && (
                  <>
                    <p className="text-sm text-slate-400 mt-2">Page ID</p>
                    <p className="text-slate-200 truncate text-sm">{bookmark.pageId}</p>
                  </>
                )}
              </div>
              <button
                onClick={() => handleRemove(bookmark.id)}
                disabled={removeBookmark.isPending}
                className="ml-2 text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(bookmark.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
