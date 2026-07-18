'use client';

import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Layers, ShieldCheck, RefreshCw, Activity } from 'lucide-react';
import { adminApi } from '@/services/admin-api';
import { healthApi } from '@/services/health-api';
import { mangaApi } from '@/services/manga-api';

export function AdminOverview() {
  const [stats, setStats] = useState({
    usersCount: 0,
    studiosCount: 0,
    seriesCount: 0,
    servicesHealthy: true,
    servicesCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // Fetch in parallel safely
      const [usersRes, studiosRes, seriesRes, healthRes] = await Promise.allSettled([
        adminApi.listUsers({ pageSize: 1 }),
        adminApi.listStudios(),
        mangaApi.getSeries(),
        healthApi.getServices(),
      ]);

      let usersCount = 0;
      if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
        usersCount = usersRes.value.data.data.totalItems || 0;
      }

      let studiosCount = 0;
      if (studiosRes.status === 'fulfilled' && studiosRes.value.data.success) {
        studiosCount = studiosRes.value.data.data.length || 0;
      }

      let seriesCount = 0;
      if (seriesRes.status === 'fulfilled' && seriesRes.value.data.success) {
        seriesCount = seriesRes.value.data.data.length || 0;
      }

      let servicesHealthy = true;
      let servicesCount = 0;
      if (healthRes.status === 'fulfilled') {
        const services = healthRes.value.data;
        servicesCount = Object.keys(services).length;
        servicesHealthy = Object.values(services).every(status => status === 'Healthy');
      }

      setStats({
        usersCount,
        studiosCount,
        seriesCount,
        servicesHealthy,
        servicesCount,
      });
    } catch (err) {
      console.error('Failed to load dashboard overview stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total User Accounts</p>
            <h3 className="text-2xl font-extrabold text-white mt-1.5 font-mono">
              {loading ? '...' : stats.usersCount}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Synced with Identity DB</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/5">
            <Users size={18} />
          </div>
        </div>

        {/* Registered Studios */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Studios</p>
            <h3 className="text-2xl font-extrabold text-white mt-1.5 font-mono">
              {loading ? '...' : stats.studiosCount}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Creator production spaces</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/5">
            <Layers size={18} />
          </div>
        </div>

        {/* Total Series */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Manga Series</p>
            <h3 className="text-2xl font-extrabold text-white mt-1.5 font-mono">
              {loading ? '...' : stats.seriesCount}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Ongoing and draft titles</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/5">
            <BookOpen size={18} />
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Services status</p>
            <h3 className={`text-sm font-extrabold mt-2 flex items-center gap-1.5 ${stats.servicesHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
              <ShieldCheck size={16} />
              {stats.servicesHealthy ? 'All Healthy' : 'Degraded Status'}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1.5">{stats.servicesCount} core gateways tracked</p>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
            stats.servicesHealthy 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/5' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/5'
          }`}>
            <Activity size={18} />
          </div>
        </div>
      </div>

      {/* Observability Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Observability Status</span>
          <button 
            onClick={fetchOverviewData} 
            disabled={loading} 
            className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-450 hover:text-slate-200 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </h4>
        <div className="bg-slate-950/60 border border-slate-850 rounded-lg p-4 font-mono text-[10px] text-slate-400 leading-relaxed space-y-1">
          <div><span className="text-indigo-400">&gt;</span> Identity Service integration status: <span className="text-emerald-400 font-bold">ONLINE</span></div>
          <div><span className="text-indigo-400">&gt;</span> RabbitMQ EventBus consumer: <span className="text-emerald-400 font-bold">ACK ACTIVE</span></div>
          <div><span className="text-indigo-450">&gt;</span> Log Observability LogViewer: <span className="text-amber-500 font-bold">BACKLOG (No endpoint defined on backend Gateway)</span></div>
          <div><span className="text-indigo-450">&gt;</span> Direct Lokilink/Prometheus access: <span className="text-rose-500 font-bold">BLOCKED (Disabled browser to Loki direct queries)</span></div>
        </div>
      </div>
    </div>
  );
}
export default AdminOverview;
