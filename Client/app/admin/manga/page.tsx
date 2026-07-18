'use client';

import React from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import SeriesManagement from '@/components/admin/SeriesManagement';

export default function AdminMangaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">Manga & Chapters Administration</h1>
        <p className="text-xs text-slate-500 font-medium">Verify series proposals, configure test fixtures, upload page files, and publish chapters.</p>
      </div>
      <SeriesManagement />
    </div>
  );
}
