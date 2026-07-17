/**
 * Notification API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 * Route: /notifications/**
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { NotificationResponse, UnreadCountResponse } from '@/types/notification';

export const notificationApi = {
  /**
   * GET /notifications/my
   */
  getMyNotifications: () =>
    api.get<ApiResponse<NotificationResponse[]>>('/notifications/my'),

  /**
   * GET /notifications/unread-count
   */
  getUnreadCount: () =>
    api.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count'),

  /**
   * POST /notifications/{id}/read
   */
  markAsRead: (id: string) =>
    api.post<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`),

  /**
   * POST /notifications/read-all
   */
  markAllAsRead: () =>
    api.post<ApiResponse<UnreadCountResponse>>('/notifications/read-all'),

  /**
   * DELETE /notifications/{id}
   */
  deleteNotification: (id: string) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`),
};
