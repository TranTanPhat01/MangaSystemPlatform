'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { MangakaDashboard } from '@/components/mangaka/MangakaDashboard';
import { AssistantDashboard } from '@/components/assistant/AssistantDashboard';
import { EditorialBoardDashboard } from '@/components/board/EditorialBoardDashboard';
import { TantouEditorDashboard } from '@/components/editorial/TantouEditorDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { normalizeRole } from '@/lib/roles';

export default function DashboardPage() {
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
          <p className="text-sm font-medium tracking-wide">Resolving workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return null;
  }

  const roles = (user.roles || []).map(normalizeRole).filter((role): role is NonNullable<typeof role> => Boolean(role));

  if (roles.includes('admin')) {
    router.replace('/admin/users');
    return null;
  }
  
  if (roles.includes('mangaka')) {
    return <MangakaDashboard />;
  }

  if (roles.includes('assistant')) {
    return <AssistantDashboard />;
  }

  if (roles.includes('tantoueditor')) {
    return <TantouEditorDashboard />;
  }

  if (roles.includes('editorialboard')) {
    return <EditorialBoardDashboard />;
  }

  return <div className="flex h-screen items-center justify-center"><p>Forbidden: no recognized role.</p></div>;
}
