import React, { useState } from 'react';
import MangakaSidebar from './MangakaSidebar';
import DashboardHeader from './DashboardHeader';

interface MangakaAppShellProps {
  children: React.ReactNode;
  activeSidebarItem: string;
  onSidebarNavigate: (item: string) => void;
}

export default function MangakaAppShell({
  children,
  activeSidebarItem,
  onSidebarNavigate,
}: MangakaAppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mockUser = {
    name: 'Akira',
    avatarUrl: '',
    role: 'Mangaka (Chief Artist)'
  };

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-800 overflow-hidden font-sans antialiased">
      {/* Fixed Left Sidebar (dark) */}
      <MangakaSidebar
        activeItem={activeSidebarItem}
        onNavigate={onSidebarNavigate}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <DashboardHeader
          user={mockUser}
          notificationsCount={12}
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
