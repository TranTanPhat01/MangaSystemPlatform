'use client';

import React from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">User Directory Management</h1>
        <p className="text-xs text-slate-500 font-medium">Search user accounts, toggle system statuses, reset credentials, and audit security claims.</p>
      </div>
      <UserManagement />
    </div>
  );
}
