'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Securing portal...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return null;
  }

  // Safe role check (case-insensitive)
  const is_admin = (user.roles || []).some(
    (role) => role.toLowerCase() === 'admin'
  );

  if (!is_admin) {
    // Premium Access Denied UI
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="mx-auto h-16 w-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center animate-pulse">
            <ShieldAlert size={32} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold tracking-tight">403 Forbidden</h1>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
              You do not have administrative permissions to access this section of the system.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-850 font-mono text-[10px] space-y-1 text-slate-400">
            <div><span className="text-slate-600">User:</span> {user.fullName}</div>
            <div><span className="text-slate-600">Roles:</span> {user.roles?.join(', ') || 'None'}</div>
            <div><span className="text-slate-600">Required:</span> Admin</div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-700 hover:bg-indigo-850 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-650/10 hover:shadow-indigo-850/20 transition-all duration-200"
            >
              <ArrowLeft size={14} />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
