/**
 * Admin API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';

// --- Types ---
export interface AdminUserListItem {
  id: string;
  displayName: string;
  email: string;
  username?: string;
  roles: string[];
  status: number; // 1 = Active, 2 = Disabled, 3 = Locked
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  lockoutUntil?: string;
}

export interface AdminSecurityEvent {
  actorUserId: string;
  action: string;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  lockoutUntil?: string;
  permissions: string[];
  recentSecurityEvents: AdminSecurityEvent[];
}

export interface AdminUserListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string; // "Active", "Disabled", "Locked"
  sortBy?: string;
  sortDirection?: string;
}

export interface AdminRoleCatalog {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface AdminAuditLogItem {
  id: string;
  action: string;
  details?: string | null;
  createdAt: string;
}

export interface StudioResponse {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminCreateSeriesRequest {
  studioId: string;
  title: string;
  description?: string;
  genre?: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const adminApi = {
  // --- User Administration (/identity/admin) ---
  
  listUsers: (query: AdminUserListQuery) =>
    api.get<ApiResponse<PagedResponse<AdminUserListItem>>>('/identity/admin/users', { params: query }),

  getUserDetail: (userId: string) =>
    api.get<ApiResponse<AdminUserDetail>>(`/identity/admin/users/${userId}`),

  updateUserStatus: (userId: string, data: { status: number; lockoutUntil?: string | null }) =>
    api.patch<ApiResponse<any>>(`/identity/admin/users/${userId}/status`, data),

  updateUserRoles: (userId: string, data: { roles: string[] }) =>
    api.patch<ApiResponse<any>>(`/identity/admin/users/${userId}/roles`, data),

  createUser: (data: { email: string; username: string; fullName: string; password: string; roles: string[] }) =>
    api.post<ApiResponse<any>>('/identity/admin/users', data),

  updateUser: (userId: string, data: { username: string; fullName: string }) =>
    api.patch<ApiResponse<any>>(`/identity/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    api.delete<ApiResponse<boolean>>(`/identity/admin/users/${userId}`),

  lockUser: (userId: string, data: { lockoutUntil?: string | null; reason: string }) =>
    api.post<ApiResponse<any>>(`/identity/admin/users/${userId}/lock`, data),

  unlockUser: (userId: string) =>
    api.post<ApiResponse<any>>(`/identity/admin/users/${userId}/unlock`),

  resetUserPassword: (userId: string, data: { newPassword: string }) =>
    api.post<ApiResponse<any>>(`/identity/admin/users/${userId}/reset-password`, data),

  revokeUserSessions: (userId: string) =>
    api.post<ApiResponse<any>>(`/identity/admin/users/${userId}/revoke-sessions`),

  getRoles: () =>
    api.get<ApiResponse<AdminRoleCatalog[]>>('/identity/admin/roles'),

  createRole: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<AdminRoleCatalog>>('/identity/admin/roles', data),

  updateRole: (roleId: string, data: { description?: string }) =>
    api.patch<ApiResponse<AdminRoleCatalog>>(`/identity/admin/roles/${roleId}`, data),

  retireRole: (roleId: string) =>
    api.delete<ApiResponse<boolean>>(`/identity/admin/roles/${roleId}`),

  replaceRolePermissions: (roleId: string, data: { permissionKeys: string[] }) =>
    api.put<ApiResponse<AdminRoleCatalog>>(`/identity/admin/roles/${roleId}/permissions`, data),

  getPermissions: () =>
    api.get<ApiResponse<string[]>>('/identity/admin/permissions'),

  getAuditLogs: (query?: { page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PagedResponse<AdminAuditLogItem>>>('/identity/admin/audit-logs', { params: query }),

  // --- Studio & Series Administration (/manga) ---
  
  listStudios: () =>
    api.get<ApiResponse<StudioResponse[]>>('/manga/studios/my'),

  createStudio: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<StudioResponse>>('/manga/studios', data),

  createSeries: (data: AdminCreateSeriesRequest) =>
    api.post<ApiResponse<any>>('/manga/series', data),

  updateSeries: (seriesId: string, data: { title?: string; description?: string; genre?: string; status?: number }) =>
    api.patch<ApiResponse<any>>(`/manga/series/${seriesId}`, data),

  createChapter: (seriesId: string, data: { chapterNumber: number; title: string }) =>
    api.post<ApiResponse<any>>(`/manga/series/${seriesId}/chapters`, data),

  getChapters: (seriesId: string) =>
    api.get<ApiResponse<any[]>>(`/manga/series/${seriesId}/chapters`),

  getChapterPages: (chapterId: string) =>
    api.get<ApiResponse<any[]>>(`/manga/chapters/${chapterId}/pages`),

  createPage: (chapterId: string, data: { pageNumber: number; fileId: string }) =>
    api.post<ApiResponse<any>>(`/manga/chapters/${chapterId}/pages`, data),

  publishChapter: (chapterId: string) =>
    api.patch<ApiResponse<any>>(`/manga/chapters/${chapterId}/status`, { status: 7 }), // Status 7 = Published
};
