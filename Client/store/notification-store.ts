import { create } from 'zustand';
import { NotificationResponse } from '@/types/notification';
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';

interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: NotificationResponse) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<NotificationResponse[]>>('/notifications/my');
      if (response.data && response.data.success) {
        set({ notifications: response.data.data });
      } else {
        set({ error: response.data.message || 'Failed to load notifications.' });
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Could not reach notification service. Please try again.';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
      if (response.data && response.data.success) {
        set({ unreadCount: response.data.data.unreadCount });
      }
      // silently skip on error – unread badge is non-critical
    } catch {
      // Non-critical: do not set error state for unread count
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.post<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`);
      if (response.data && response.data.success) {
        const wasUnread = get().notifications.find((n) => n.id === id)?.status === 1;
        const updatedNotifications = get().notifications.map((n) =>
          n.id === id ? { ...n, status: 2, readAt: new Date().toISOString() } : n
        );
        set({
          notifications: updatedNotifications,
          unreadCount: Math.max(0, get().unreadCount - (wasUnread ? 1 : 0)),
        });
      } else {
        set({ error: response.data.message || 'Failed to mark notification as read.' });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to mark notification as read.';
      set({ error: message });
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.post<ApiResponse<{ unreadCount: number }>>('/notifications/read-all');
      if (response.data && response.data.success) {
        const updatedNotifications = get().notifications.map((n) => ({
          ...n,
          status: 2,
          readAt: new Date().toISOString(),
        }));
        set({ notifications: updatedNotifications, unreadCount: 0 });
      } else {
        set({ error: response.data.message || 'Failed to mark all notifications as read.' });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to mark all as read.';
      set({ error: message });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await api.delete<ApiResponse<null>>(`/notifications/${id}`);
      if (response.data && response.data.success) {
        const deleted = get().notifications.find((n) => n.id === id);
        const wasUnread = deleted?.status === 1;
        set({
          notifications: get().notifications.filter((n) => n.id !== id),
          unreadCount: Math.max(0, get().unreadCount - (wasUnread ? 1 : 0)),
        });
      } else {
        set({ error: response.data.message || 'Failed to delete notification.' });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to delete notification.';
      set({ error: message });
    }
  },

  addNotification: (notification: NotificationResponse) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
