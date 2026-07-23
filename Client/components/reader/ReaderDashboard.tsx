'use client';

import React, { useState } from 'react';
import { useReader } from '@/hooks/useReader';
import { Heart, Bookmark, Clock, Star, MessageCircle } from 'lucide-react';
import FavoritesTab from './FavoritesTab';
import BookmarksTab from './BookmarksTab';
import HistoryTab from './HistoryTab';
import RatingsTab from './RatingsTab';
import CommentsTab from './CommentsTab';

type TabType = 'favorites' | 'bookmarks' | 'history' | 'ratings' | 'comments';

export default function ReaderDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const { activitySummary } = useReader();

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'favorites', label: 'Favorites', icon: <Heart className="h-4 w-4" /> },
    { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="h-4 w-4" /> },
    { id: 'history', label: 'History', icon: <Clock className="h-4 w-4" /> },
    { id: 'ratings', label: 'Ratings', icon: <Star className="h-4 w-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Activity Summary */}
      {activitySummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Favorites</p>
            <p className="text-3xl font-bold text-slate-100">{activitySummary.favoriteCount || 0}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Bookmarks</p>
            <p className="text-3xl font-bold text-slate-100">{activitySummary.bookmarkCount || 0}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">History</p>
            <p className="text-3xl font-bold text-slate-100">{activitySummary.historyCount || 0}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Ratings</p>
            <p className="text-3xl font-bold text-slate-100">{activitySummary.ratingCount || 0}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Comments</p>
            <p className="text-3xl font-bold text-slate-100">{activitySummary.commentCount || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300 border-b-2 border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'favorites' && <FavoritesTab />}
          {activeTab === 'bookmarks' && <BookmarksTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'ratings' && <RatingsTab />}
          {activeTab === 'comments' && <CommentsTab />}
        </div>
      </div>
    </div>
  );
}
