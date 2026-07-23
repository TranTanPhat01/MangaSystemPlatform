'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';

interface ReaderLayoutProps {
  children: React.ReactNode;
}

export default function ReaderLayout({ children }: ReaderLayoutProps) {
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
          <p className="text-sm font-medium tracking-wide">Loading reader profile...</p>
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

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
