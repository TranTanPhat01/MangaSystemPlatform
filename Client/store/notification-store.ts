import { create } from 'zustand';
import { NotificationResponse } from '@/types/notification';
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';

interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: NotificationResponse) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<ApiResponse<NotificationResponse[]>>('/notifications/my');
      if (response.data && response.data.success) {
        set({ notifications: response.data.data });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.post<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`);
      if (response.data && response.data.success) {
        // Update notification status in store (1 = Unread, 2 = Read)
        const updatedNotifications = get().notifications.map((n) =>
          n.id === id ? { ...n, status: 2, readAt: new Date().toISOString() } : n
        );
        const wasUnread = get().notifications.find((n) => n.id === id)?.status === 1;
        set({
          notifications: updatedNotifications,
          unreadCount: Math.max(0, get().unreadCount - (wasUnread ? 1 : 0)),
        });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
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
        set({
          notifications: updatedNotifications,
          unreadCount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification: NotificationResponse) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
