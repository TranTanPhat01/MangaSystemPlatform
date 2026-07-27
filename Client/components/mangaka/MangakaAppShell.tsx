import React, { useState } from 'react';
import MangakaSidebar from './MangakaSidebar';
import DashboardHeader from './DashboardHeader';
import { useAuthStore } from '@/store/auth-store';
import { useNotifications } from '@/hooks/useNotifications';

interface MangakaAppShellProps {
  children: React.ReactNode;
  activeSidebarItem: string;
  onSidebarNavigate: (item: string) => void;
  seriesCount: number;
  taskCount: number;
}

export default function MangakaAppShell({
  children,
  activeSidebarItem,
  onSidebarNavigate,
  seriesCount,
  taskCount,
}: MangakaAppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuthStore();
  const { unreadCount } = useNotifications();

  const displayUser = {
    name: user?.fullName || 'Mangaka',
    avatarUrl: '',
    role: 'Mangaka'
  };

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-800 overflow-hidden font-sans antialiased">
      {/* Fixed Left Sidebar (dark) */}
      <MangakaSidebar
        activeItem={activeSidebarItem}
        onNavigate={onSidebarNavigate}
        sidebarOpen={sidebarOpen}
        seriesCount={seriesCount}
        taskCount={taskCount}
        notificationCount={unreadCount}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <DashboardHeader
          user={displayUser}
          notificationsCount={0}
          onSearch={(q) => console.log('Search:', q)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-7 bg-[#F4F6FA] space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar overlay */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
}
