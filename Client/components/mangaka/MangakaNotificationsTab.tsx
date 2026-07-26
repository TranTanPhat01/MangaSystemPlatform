'use client';

import React from 'react';
import { Bell, BellOff, Trash2, CheckCheck, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface MangakaNotificationsTabProps {
  triggerModal?: (title: string, content: string) => void;
}

export default function MangakaNotificationsTab({ triggerModal }: MangakaNotificationsTabProps) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Studio Notifications</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Task updates, editorial feedback, and system alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
          <button
            onClick={() => void fetchNotifications()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button
              onClick={() => void fetchNotifications()}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 mt-1 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && notifications.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin text-slate-400" />
          <p className="ml-3 text-sm text-slate-500">Loading notifications…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && notifications.length === 0 && !error && (
        <div className="bg-white border border-slate-150 rounded-xl p-10 text-center shadow-sm">
          <BellOff size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No notifications yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            You&apos;ll be notified when tasks are assigned, submissions reviewed, or editorial decisions are made.
          </p>
        </div>
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {/* Summary bar */}
          <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Bell size={13} />
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50/60 ${
                n.isRead ? 'opacity-70' : 'bg-indigo-50/30'
              }`}
            >
              {/* Unread dot */}
              <div className="mt-1 flex-shrink-0">
                {n.isRead ? (
                  <div className="h-2 w-2 rounded-full bg-slate-200" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-100" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                  {n.title}
                </p>
                {n.message && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                )}
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.isRead && (
                  <button
                    title="Mark as read"
                    onClick={() => void markAsRead(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button
                  title="Delete notification"
                  onClick={() => void deleteNotification(n.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
