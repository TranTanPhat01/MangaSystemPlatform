'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '@/store/notification-store';
import { useAuthStore } from '@/store/auth-store';
import { createSignalRConnection, startSignalRConnection, stopSignalRConnection } from '@/lib/signalr';
import { HubConnection } from '@microsoft/signalr';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Clipboard, 
  FileCheck, 
  Mail, 
  CheckCheck,
  TrendingUp,
  Server,
  Trash2,
  RefreshCw,
  X
} from 'lucide-react';
import { NotificationResponse, NotificationType } from '@/types/notification';

export default function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    error,
    fetchNotifications, 
    fetchUnreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearError,
    reconcileAfterReconnect,
  } = useNotificationStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Set up SignalR with enhanced reconnection handling
  useEffect(() => {
    if (!accessToken) return;

    const connection = createSignalRConnection(accessToken);
    connectionRef.current = connection;

    // Backend may emit either name – register both to be safe
    const handleNotification = (notification: NotificationResponse) => {
      console.log('[SignalR] Received notification:', notification.id);
      addNotification(notification);
    };

     // Schedule reconnect with exponential backoff
    const scheduleReconnect = (connection: HubConnection) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (accessToken) {
        console.log('[SignalR] Attempting manual reconnect...');
        startSignalRConnection(connection).then(() => {
          setConnectionStatus('connected');
          });
        }
      }, 5000); // 5 second retry
    };

    // Event listeners for notifications
    connection.on('NotificationReceived', handleNotification);
    connection.on('ReceiveNotification', handleNotification);

    // Task update events (if backend broadcasts these via SignalR)
    connection.on('TaskStatusChanged', (taskData: any) => {
      console.log('[SignalR] Task status changed:', taskData);
      // Could trigger toast or invalidate queries here
    });

    // Editorial update events (if backend broadcasts these via SignalR)
    connection.on('EditorialDecisionMade', (editorialData: any) => {
      console.log('[SignalR] Editorial decision made:', editorialData);
      // Could trigger toast or invalidate queries here
    });

    // Connection state handlers
    connection.onreconnecting(() => {
      console.log('[SignalR] Attempting to reconnect...');
      setConnectionStatus('reconnecting');
    });

    connection.onreconnected(() => {
      console.log('[SignalR] Reconnected successfully, reconciling state...');
      setConnectionStatus('connected');
      // Reconcile state after reconnect
      reconcileAfterReconnect();
      // Refresh unread count
      fetchUnreadCount();
    });

    connection.onclose(() => {
      console.log('[SignalR] Connection closed');
      setConnectionStatus('disconnected');
      // Attempt reconnect with exponential backoff
      scheduleReconnect(connection);
    });

    startSignalRConnection(connection).then(() => {
      setConnectionStatus('connected');
    });

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopSignalRConnection(connection).catch((err) => {
        console.warn('[SignalR] Error during cleanup:', err);
      });
      connectionRef.current = null;
    };
  }, [accessToken, addNotification, reconcileAfterReconnect, fetchUnreadCount]);

 

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TaskAssigned:
        return <Clipboard className="h-4 w-4 text-sky-400" />;
      case NotificationType.TaskSubmitted:
        return <Clipboard className="h-4 w-4 text-yellow-400" />;
      case NotificationType.TaskApproved:
        return <Check className="h-4 w-4 text-emerald-400" />;
      case NotificationType.ChapterSubmittedForReview:
        return <FileCheck className="h-4 w-4 text-purple-400" />;
      case NotificationType.ChapterApproved:
        return <Check className="h-4 w-4 text-green-400" />;
      case NotificationType.RankingCalculated:
        return <TrendingUp className="h-4 w-4 text-pink-400" />;
      case NotificationType.CancellationWarning:
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case NotificationType.System:
        return <Server className="h-4 w-4 text-teal-400" />;
      default:
        return <Mail className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with connection indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/80 border border-transparent hover:border-slate-800/40 transition-all duration-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 flex items-center justify-center bg-indigo-600 text-[9px] font-bold text-white rounded-full border border-slate-900 shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Connection status indicator */}
        <span className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-slate-900 ${
          connectionStatus === 'connected' ? 'bg-emerald-500' : 
          connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 
          'bg-slate-600'
        }`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden z-50 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <span className="font-semibold text-sm text-slate-200">Notifications</span>
            <div className="flex items-center gap-2">
              {/* Connection status text */}
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-slate-700/50 text-slate-500'
              }`}>
                {connectionStatus}
              </span>
              {/* Refresh button */}
              <button
                onClick={() => { clearError(); fetchNotifications(); }}
                className="p-1 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-800/60 transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  <CheckCheck size={14} className="inline mr-0.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 flex items-start gap-2">
              <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-300 flex-1">{error}</p>
              <button
                onClick={clearError}
                className="text-rose-400 hover:text-rose-200 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-slate-500 text-xs">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-1" />
              <p>Loading notifications…</p>
            </div>
          )}

          {/* List */}
          {!isLoading && (
            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-800/60 bg-slate-900/40">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Bell size={24} className="opacity-30 mb-1" />
                  <span className="text-sm font-medium">No notifications yet</span>
                  <span className="text-xs text-slate-600">We will notify you here when updates occur.</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors flex gap-3 ${
                      notification.status === 1 ? 'bg-indigo-600/5 hover:bg-indigo-600/10' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Icon */}
                    <div className="h-8 w-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`text-xs font-semibold truncate ${
                          notification.status === 1 ? 'text-slate-200 font-bold' : 'text-slate-400 font-semibold'
                        }`}>
                          {notification.title}
                        </span>
                        <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed break-words ${
                        notification.status === 1 ? 'text-slate-350 font-medium' : 'text-slate-400'
                      }`}>
                        {notification.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 self-center">
                      {notification.status === 1 && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-all duration-150"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all duration-150"
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
