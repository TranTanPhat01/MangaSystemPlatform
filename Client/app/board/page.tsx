'use client';

import React, { Suspense } from 'react';
import { BoardDashboard } from '@/components/board/BoardDashboard';

export default function BoardPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-700 text-xs font-semibold">
        Loading board workspace...
      </div>
    }>
      <BoardDashboard />
    </Suspense>
  );
}
