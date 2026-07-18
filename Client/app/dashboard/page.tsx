'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { MangakaDashboard } from '@/components/mangaka/MangakaDashboard';
import { AssistantDashboard } from '@/components/assistant/AssistantDashboard';
import { EditorialBoardDashboard } from '@/components/board/EditorialBoardDashboard';
import { TantouEditorDashboard } from '@/components/editorial/TantouEditorDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

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

  // Safe role normalization: lowercase and strip spaces/underscores
  const roles = (user.roles || []).map((r) =>
    r.toLowerCase().replace(/[\s_-]/g, '')
  );

  if (roles.includes('admin')) {
    if (typeof window !== 'undefined') {
      router.replace('/admin/users');
    }
    return null;
  }
  
  if (roles.includes('mangaka')) {
    return <MangakaDashboard />;
  }

  if (roles.includes('assistant')) {
    return <AssistantDashboard />;
  }

  if (roles.includes('tantoueditor') || roles.includes('editor')) {
    return <TantouEditorDashboard />;
  }

  if (roles.includes('editorialboard') || roles.includes('board')) {
    return <EditorialBoardDashboard />;
  }

  // Default fallback if no known role matches
  return <MangakaDashboard />;
}
