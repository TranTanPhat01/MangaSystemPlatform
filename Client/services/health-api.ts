/**
 * Health Check API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';

export interface HealthCheckResponse {
  status: string;
}

export interface DependencyHealth {
  name: string;
  type: string;
  status: string;
  latencyMs?: number | null;
}

export interface OutboxServiceSummary {
  service: string;
  pending: number;
  failed: number;
  publishedLast24h: number;
  lastFailedAt?: string | null;
}

export interface ServiceHealthDetail {
  name: string;
  status: string;
  version: string;
  build: string;
  checkedAt: string;
  uptimeSeconds?: number | null;
  dependencies: DependencyHealth[];
  warnings: string[];
  safeErrorSummary?: string | null;
  outbox?: OutboxServiceSummary | null;
}

export interface MonitoringOverviewResponse {
  status: string;
  checkedAt: string;
  environment: string;
  summary: {
    healthyServices: number;
    totalServices: number;
    totalFailedOutbox: number | null;
    totalPendingOutbox: number | null;
    criticalAlerts: number | null;
    warningAlerts: number | null;
  };
  services: ServiceHealthDetail[];
}

export const healthApi = {
  /**
   * GET /health/live
   * Gateway health check
   */
  getLive: () =>
    api.get<HealthCheckResponse>('/health/live'),

  /**
   * GET /health/ready
   * Gateway readiness check
   */
  getReady: () =>
    api.get<HealthCheckResponse>('/health/ready'),

  /**
   * GET /health/services
   * Downstream services summary. In production/staging, requires ADMIN token.
   */
  getServices: () =>
    api.get<Record<string, string>>('/health/services'),

  /**
   * GET /admin/monitoring/overview
   * Detailed overview (used for displaying services, latency, database health).
   */
  getDetailedOverview: () =>
    api.get<ApiResponse<MonitoringOverviewResponse>>('/admin/monitoring/overview'),
};
