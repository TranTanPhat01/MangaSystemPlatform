/**
 * Auth API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 * Route: /identity/**
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenRequest } from '@/types/auth';

export interface AssistantDirectoryItem { id: string; fullName: string; email: string; }

export const authApi = {
  /**
   * POST /identity/auth/login
   */
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/identity/auth/login', data),

  /**
   * POST /identity/auth/register
   */
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/identity/auth/register', data),

  /**
   * POST /identity/auth/refresh
   */
  refresh: (data: RefreshTokenRequest) =>
    api.post<ApiResponse<AuthResponse>>('/identity/auth/refresh', data),

  /**
   * POST /identity/auth/logout
   */
  logout: (data: RefreshTokenRequest) =>
    api.post<ApiResponse<string>>('/identity/auth/logout', data),

  /**
   * GET /identity/users/me
   * Returns the currently authenticated user's profile
   */
  getMe: () =>
    api.get<ApiResponse<{ id: string; email: string; fullName: string; roles: string[] }>>('/identity/users/me'),

  getAssistants: () =>
    api.get<ApiResponse<AssistantDirectoryItem[]>>('/identity/users/assistants'),
};
