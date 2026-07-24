'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Server, 
  Database, 
  Send, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { healthApi, ServiceHealthDetail, MonitoringOverviewResponse } from '@/services/health-api';
import axios from 'axios';

const FALLBACK_SERVICE_NAMES = [
  'Identity Service',
  'Manga Management Service',
  'Editorial Service',
  'Notification Service',
  'File Service',
];
const HEALTH_STATUSES = new Set(['healthy', 'degraded', 'unhealthy', 'unknown', 'unavailable']);

function normalizeStatus(status: unknown) {
  return typeof status === 'string' && status.trim() ? status : 'Unknown';
}

function unknownService(name: string, checkedAt: string): ServiceHealthDetail {
  return {
    name,
    status: 'Unknown',
    version: 'N/A',
    build: 'N/A',
    checkedAt,
    dependencies: [],
    warnings: ['Service status data is unavailable.'],
  };
}

function settledResponseData<T>(result: PromiseSettledResult<{ data: T }>): T | undefined {
  if (result.status === 'fulfilled') return result.value.data;
  return (result.reason as { response?: { data?: T } })?.response?.data;
}

function serviceStatusEntries(payload: unknown): Array<[string, string]> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  return Object.entries(payload)
    .filter(([name, status]) =>
      name.toLowerCase() !== 'gateway'
      && typeof status === 'string'
      && HEALTH_STATUSES.has(status.toLowerCase()))
    .map(([name, status]) => [name, status as string]);
}

export function SystemHealth() {
  const [data, setData] = useState<MonitoringOverviewResponse | null>(null);
  const hasUsableDataRef = useRef(false);
  const latestRequestRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number>(15000); // 15s default
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);

  // Refs for tracking active state in polling timers without invalidating useCallback
  const pollingActiveRef = useRef(isPollingActive);
  const pollingIntervalRef = useRef(pollingInterval);
  const pollTimeoutRef = useRef<any>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    pollingActiveRef.current = isPollingActive;
    pollingIntervalRef.current = pollingInterval;
  }, [isPollingActive, pollingInterval]);

  const tryFallback = useCallback(async (requestId: number, signal?: AbortSignal) => {
    if (requestId !== latestRequestRef.current) return;
    const [liveResult, servicesResult] = await Promise.allSettled([
      healthApi.getLive({ signal }),
      healthApi.getServices({ signal }),
    ]);
    if (requestId !== latestRequestRef.current) return;
    const checkedAt = new Date().toISOString();
    const livePayload = settledResponseData(liveResult);
    const servicePayload = settledResponseData(servicesResult);
    const liveStatus = normalizeStatus(livePayload?.status);
    const liveAvailable = liveStatus !== 'Unknown';
    const serviceEntries = serviceStatusEntries(servicePayload);
    const servicesAvailable = serviceEntries.length > 0;
    const services: ServiceHealthDetail[] = servicesAvailable
      ? serviceEntries.map(([name, status]) => ({
          name,
          status: normalizeStatus(status),
          version: 'N/A',
          build: 'N/A',
          checkedAt,
          dependencies: [],
          warnings: [],
        }))
      : FALLBACK_SERVICE_NAMES.map(name => unknownService(name, checkedAt));

    const fallbackOverview: MonitoringOverviewResponse = {
      status: liveStatus,
      checkedAt,
      environment: 'Gateway fallback',
      summary: {
        healthyServices: services.filter(service => service.status === 'Healthy').length,
        totalServices: services.length,
        totalFailedOutbox: null,
        totalPendingOutbox: null,
        criticalAlerts: null,
        warningAlerts: null,
      },
      services,
    };

    const noFallbackData = !liveAvailable && !servicesAvailable;
    const hasPreviousData = hasUsableDataRef.current;
    setData(previous => noFallbackData && previous ? previous : fallbackOverview);
    if (!noFallbackData) hasUsableDataRef.current = true;

    if (!liveAvailable && !servicesAvailable) {
      setErrorMsg(hasPreviousData
        ? 'Gateway health and service status data are unavailable. Showing last known data; timestamps may be stale.'
        : 'Gateway health and service status data are unavailable. Showing unknown fallback status.');
    } else if (!servicesAvailable) {
      setErrorMsg('Service status data is unavailable. Gateway health is shown from /health/live.');
    } else if (!liveAvailable) {
      setErrorMsg('Gateway health data is unavailable. Service statuses are shown from /health/services.');
    } else {
      setErrorMsg('Detailed monitoring is unavailable. Showing gateway fallback data.');
    }
  }, []);

  // Fetch Health Data with Fallback
  const fetchHealthData = useCallback(async () => {
    // Clear scheduled poll timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    // Cancel in-flight request
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }

    // Schedule next poll using setTimeout immediately to keep interval timing consistent with start of request
    if (pollingActiveRef.current && pollingIntervalRef.current > 0) {
      pollTimeoutRef.current = setTimeout(() => {
        void fetchHealthData();
      }, pollingIntervalRef.current);
    }

    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    // Keep errorMsg as-is so users see old warnings during slow requests instead of them disappearing

    try {
      const res = await healthApi.getDetailedOverview({ signal: abortController.signal });
      if (requestId !== latestRequestRef.current) return;
      if (res.data?.success) {
        hasUsableDataRef.current = true;
        setData(res.data.data);
        setErrorMsg(null); // Clear errorMsg on success
      } else {
        await tryFallback(requestId, abortController.signal);
      }
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
        // Ignored because request was cancelled
        return;
      }
      await tryFallback(requestId, abortController.signal);
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
        activeAbortControllerRef.current = null;
      }
    }
  }, [tryFallback]);

  // Start the poll and handle unmounting / configuration changes
  useEffect(() => {
    void fetchHealthData();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, [fetchHealthData, isPollingActive, pollingInterval]);

  // Status Style Helper
  const getStatusBadge = (status: string) => {
    const isHealthy = status === 'Healthy';
    const isUnknown = status === 'Unknown' || status === 'Unavailable';
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
        isHealthy 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : isUnknown
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      }`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notifications / Errors */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Monitoring degraded</p>
            <p className="mt-0.5 text-amber-300">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-amber-400 hover:text-amber-200 underline font-bold shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/5">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Gateway aggregation metrics</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              Environment: <span className="font-mono text-indigo-400 font-bold">{data?.environment || 'checking...'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Polling Interval Select */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Auto Poll</label>
            <select
              value={pollingInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPollingInterval(val);
                setIsPollingActive(val > 0);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value={10000}>Every 10s</option>
              <option value={15000}>Every 15s</option>
              <option value={30000}>Every 30s</option>
              <option value={60000}>Every 60s</option>
              <option value={0}>Disabled</option>
            </select>
          </div>

          <button
            onClick={() => void fetchHealthData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-bold text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Force Refresh
          </button>
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway status</p>
              <h3 className="text-base font-extrabold text-white mt-1 flex items-center gap-1">
                {data.status === 'Healthy'
                  ? <CheckCircle2 size={14} className="text-emerald-500" />
                  : <AlertTriangle size={14} className={data.status === 'Unknown' ? 'text-amber-400' : 'text-rose-400'} />}
                {data.status}
              </h3>
            </div>
            <Server size={22} className="text-slate-700" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Healthy Services</p>
              <h3 className="text-base font-extrabold text-white mt-1">
                {data.summary.healthyServices} / {data.summary.totalServices}
              </h3>
            </div>
            <Activity size={22} className="text-slate-700" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Failed Outbox</p>
              <h3 className={`text-base font-extrabold mt-1 ${(data.summary.totalFailedOutbox ?? 0) > 0 ? 'text-rose-400' : 'text-white'}`}>
                {data.summary.totalFailedOutbox ?? 'N/A'}
              </h3>
            </div>
            <AlertTriangle size={22} className="text-slate-700" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Pending Outbox</p>
              <h3 className="text-base font-extrabold text-white mt-1">
                {data.summary.totalPendingOutbox ?? 'N/A'}
              </h3>
            </div>
            <Send size={22} className="text-slate-700" />
          </div>
        </div>
      )}

      {/* Downstream Microservices Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data ? (
          data.services.map((service) => {
            const isServiceHealthy = service.status === 'Healthy';
            const isServiceUnknown = service.status === 'Unknown' || service.status === 'Unavailable';
            return (
              <div 
                key={service.name} 
                data-service-status={service.status}
                className={`bg-slate-900 border rounded-xl overflow-hidden shadow-md transition-all flex flex-col justify-between h-72 ${
                  isServiceHealthy
                    ? 'border-slate-800/80 hover:border-slate-800'
                    : isServiceUnknown
                      ? 'border-amber-500/20 hover:border-amber-500/30'
                      : 'border-rose-500/20 hover:border-rose-500/30'
                }`}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-850 flex items-center justify-between bg-slate-950/20">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{service.name}</h4>
                    <p className="text-[9px] text-slate-550 font-semibold font-mono mt-0.5">Build: {service.build} (v{service.version})</p>
                  </div>
                  {getStatusBadge(service.status)}
                </div>

                {/* Body - Dependencies Status */}
                <div className="p-4 flex-1 space-y-3 overflow-y-auto">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Database size={10} />
                    Service Dependencies
                  </div>
                  
                  {service.dependencies.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic font-semibold py-2">No internal resource dependencies configured.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {service.dependencies.map((dep) => (
                        <div key={dep.name} className="flex justify-between items-center text-[10px] p-1.5 bg-slate-950/30 rounded border border-slate-850 font-semibold">
                          <span className="text-slate-400 truncate max-w-[140px]" title={dep.name}>{dep.name}</span>
                          <div className="flex items-center gap-2">
                            {dep.latencyMs && (
                              <span className="font-mono text-[9px] text-slate-600">{dep.latencyMs}ms</span>
                            )}
                            <span className={`h-1.5 w-1.5 rounded-full ${dep.status === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Errors / Warnings */}
                  {service.warnings && service.warnings.length > 0 && (
                    <div className={`p-2 rounded text-[9px] font-semibold leading-relaxed ${
                      isServiceUnknown
                        ? 'bg-amber-500/5 border border-amber-500/10 text-amber-300'
                        : 'bg-rose-500/5 border border-rose-500/10 text-rose-400'
                    }`}>
                      {service.warnings.join(', ')}
                    </div>
                  )}
                  {service.safeErrorSummary && (
                    <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded text-[9px] text-rose-400 font-semibold leading-relaxed">
                      Error: {service.safeErrorSummary}
                    </div>
                  )}
                </div>

                {/* Outbox / Summary Footer */}
                <div className="p-3 bg-slate-950/35 border-t border-slate-850 flex justify-between items-center text-[9px] text-slate-500 font-semibold font-mono">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>Checked: {new Date(service.checkedAt).toLocaleTimeString()}</span>
                  </div>
                  {service.outbox && (
                    <div className="flex gap-2">
                      <span className={service.outbox.failed > 0 ? 'text-rose-455' : 'text-slate-550'}>
                        Failed Outbox: {service.outbox.failed}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-indigo-500" />
            Connecting Gateway and aggregating statuses...
          </div>
        )}
      </div>
    </div>
  );
}
export default SystemHealth;
