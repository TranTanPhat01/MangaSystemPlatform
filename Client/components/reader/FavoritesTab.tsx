'use client';

import React from 'react';
import { useReader } from '@/hooks/useReader';
import { Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesTab() {
  const { favorites, favoritesLoading, removeFavorite } = useReader();

  const handleRemove = async (seriesId: string) => {
    if (confirm('Remove from favorites?')) {
      await removeFavorite.mutateAsync(seriesId);
    }
  };

  if (favoritesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No favorite series yet. Start adding your favorites!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-400">Series ID</p>
                <p className="text-slate-200 font-medium truncate">{fav.seriesId}</p>
              </div>
              <button
                onClick={() => handleRemove(fav.seriesId)}
                disabled={removeFavorite.isPending}
                className="ml-2 text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <Heart className="h-5 w-5 fill-current" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(fav.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
