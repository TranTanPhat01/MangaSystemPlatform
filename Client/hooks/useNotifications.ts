import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationApi } from '@/services/notification-api';
import { NotificationResponse } from '@/types/notification';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes, unreadRes] = await Promise.all([
        notificationApi.getMyNotifications(),
        notificationApi.getUnreadCount(),
      ]);

      if (notifRes.data?.success) {
        const notifs = (notifRes.data.data || []).map((n: NotificationResponse) => ({
          id: n.id,
          type: String(n.type),
          title: n.title || 'Notification',
          message: n.message || '',
          isRead: n.status === 2 || (n.readAt !== null && n.readAt !== undefined),
          createdAt: n.createdAt,
          readAt: n.readAt,
        }));
        setNotifications(notifs);
      } else {
        setError(notifRes.data?.message || 'Failed to load notifications.');
      }

      if (unreadRes.data?.success) {
        setUnreadCount(unreadRes.data.data?.unreadCount || 0);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not load notifications.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Call API
      await notificationApi.markAsRead(notificationId);
    } catch {
      setError('Failed to mark notification as read.');
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update local state optimistically
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Call API
      await notificationApi.markAllAsRead();
    } catch {
      setError('Failed to mark all as read.');
      await fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Update local state optimistically
      const wasUnread = !notifications.find((n) => n.id === notificationId)?.isRead;
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Call API
      await notificationApi.deleteNotification(notificationId);
    } catch {
      setError('Failed to delete notification.');
      await fetchNotifications();
    }
  };

  useEffect(() => {
    // Fetch initial notifications (deferred to avoid synchronous setState in effect)
    const timer = setTimeout(() => {
      void fetchNotifications();
    }, 0);

    // Set up polling for new notifications (every 30 seconds)
    pollIntervalRef.current = setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => {
      clearTimeout(timer);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

