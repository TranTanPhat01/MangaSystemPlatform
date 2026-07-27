'use client';

import { Suspense } from 'react';
import { AssistantDashboard } from '@/components/assistant/AssistantDashboard';

export default function AssistantPage() {
  return (
    <Suspense fallback={<AssistantLoadingState />}>
      <AssistantDashboard />
    </Suspense>
  );
}

function AssistantLoadingState() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-semibold tracking-wide">Loading assistant workspace…</p>
      </div>
    </div>
  );
}
