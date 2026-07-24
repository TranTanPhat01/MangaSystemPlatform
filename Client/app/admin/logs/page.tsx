'use client';

import React from 'react';
import LogViewerTab from '@/components/admin/LogViewerTab';

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">Security Audit Logs</h1>
        <p className="text-xs text-slate-500 font-medium">Monitor identity and gateway administrative events.</p>
      </div>
      <LogViewerTab />
    </div>
  );
}
