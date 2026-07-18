'use client';

import React from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { useAuthStore } from '@/store/auth-store';
import { Users, Settings, BookOpen, ShieldAlert, Cpu } from 'lucide-react';
import Link from 'next/link';
import AdminOverview from './AdminOverview';

export function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 p-6 md:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                <Cpu size={10} className="animate-pulse" />
                Administrative Workspace
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.fullName || 'Administrator'}
              </h1>
              <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
                Here you can manage user profiles, update system-wide roles, audit background integrations, monitor gateway microservices, and configure sandbox series test fixtures.
              </p>
            </div>
            
            {/* System Status Quick Indicator */}
            <div className="shrink-0 bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway Status</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">Online & Secure</div>
              </div>
            </div>
          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-indigo-500/5 blur-3xl rounded-full" />
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/admin/users" 
            className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 shadow-md flex flex-col justify-between h-44"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform duration-300">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mt-4 group-hover:text-white transition-colors">User Profiles</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                Activate or disable accounts, assign system roles, and inspect security events.
              </p>
            </div>
            <div className="text-[10px] font-bold text-indigo-400 group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-1">
              Go to Users &rarr;
            </div>
          </Link>

          <Link 
            href="/admin/system" 
            className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 shadow-md flex flex-col justify-between h-44"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <Settings size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mt-4 group-hover:text-white transition-colors">System Health</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                Track microservice connectivity, check service latencies, and review event configurations.
              </p>
            </div>
            <div className="text-[10px] font-bold text-indigo-400 group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-1">
              Go to System Health &rarr;
            </div>
          </Link>

          <Link 
            href="/admin/manga" 
            className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 shadow-md flex flex-col justify-between h-44"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <BookOpen size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mt-4 group-hover:text-white transition-colors">Manga Management</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                Setup test fixtures, create public ongoing series, manage chapters, and publish content.
              </p>
            </div>
            <div className="text-[10px] font-bold text-indigo-400 group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-1">
              Go to Manga &rarr;
            </div>
          </Link>
        </div>

        {/* Overview Stats Dashboard */}
        <div className="pt-2">
          <div className="border-t border-slate-850 pt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <ShieldAlert size={14} className="text-indigo-400" />
              Live System Overview
            </h2>
            <AdminOverview />
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
export default AdminDashboard;
