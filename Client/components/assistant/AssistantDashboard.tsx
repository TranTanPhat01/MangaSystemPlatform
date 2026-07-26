'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AssistantSidebar from './AssistantSidebar';
import AssistantHeader from './AssistantHeader';
import AssistantDashboardContent from './AssistantDashboardContent';
import AssistantRevisionPanel from './AssistantRevisionPanel';
import AssistantProgressPanel from './AssistantProgressPanel';
import { ActiveNav } from '@/types/assistant';

export function AssistantDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeNav = (searchParams?.get('tab') || 'Dashboard') as ActiveNav;
  const taskId = searchParams?.get('taskId');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (taskId) {
      router.replace(`/tasks?taskId=${taskId}`);
    }
  }, [taskId, router]);

  const handleNavigate = (n: ActiveNav) => {
    if (n === 'My Tasks') {
      router.push('/tasks');
    } else {
      router.push(`/assistant?tab=${encodeURIComponent(n)}`);
    }
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'Dashboard':
        return <AssistantDashboardContent />;
      case 'Revision Requests':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Revision Requests</h1>
            <AssistantRevisionPanel />
          </div>
        );
      case 'Earnings':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Earnings & Progress</h1>
            <AssistantProgressPanel />
          </div>
        );
      case 'My Tasks':
      case 'Assigned Pages':
      case 'Submissions':
      case 'Files & Assets':
      case 'Notifications':
      case 'Settings':
      default:
        return (
          <div className="bg-white border border-slate-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm mt-8 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800">Module: {activeNav}</h3>
            <p className="text-sm text-slate-500 font-semibold mt-1.5 max-w-md mx-auto">
              Không có API thật cho tab này. Module đang hiển thị giao diện mẫu.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-800 overflow-hidden font-sans antialiased">
      <AssistantSidebar active={activeNav} onNavigate={handleNavigate} open={sidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AssistantHeader onToggleSidebar={() => setSidebarOpen(s => !s)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-7 bg-[#F4F6FA]">
          {renderContent()}
        </main>
      </div>

      {/* Mobile overlay */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
}
