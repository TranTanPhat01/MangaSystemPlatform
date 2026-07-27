'use client';
import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  Feather, 
  CheckSquare, 
  FolderKanban, 
  FileText, 
  Trophy, 
  Bell, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import Logo from './Logo';
import { useAuthStore } from '@/store/auth-store';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string | number;
  badgeType?: 'count' | 'alert' | 'risk';
}

interface MangakaSidebarProps {
  activeItem: string;
  onNavigate: (item: string) => void;
  sidebarOpen?: boolean;
  seriesCount: number;
  taskCount: number;
  notificationCount: number;
}

export default function MangakaSidebar({
  activeItem,
  onNavigate,
  sidebarOpen = true,
  seriesCount,
  taskCount,
  notificationCount,
}: MangakaSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || 'Mangaka';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const menuItems: SidebarItem[] = [
    { name: 'Dashboard',         icon: LayoutDashboard },
    { name: 'My Series',         icon: BookOpen,      badge: seriesCount,       badgeType: 'count' },
    { name: 'Chapters',          icon: Layers,        badge: seriesCount,       badgeType: 'count' },
    { name: 'Page Editor',       icon: Feather },
    { name: 'Tasks',             icon: CheckSquare,   badge: taskCount,      badgeType: 'count' },
    { name: 'Files',             icon: FolderKanban },
    { name: 'Editorial Reviews', icon: FileText },
    { name: 'Rankings',          icon: Trophy },
    { name: 'Notifications',     icon: Bell,          badge: notificationCount,       badgeType: 'count' },
    { name: 'Settings',          icon: Settings },
  ];

  return (
    <aside
      className={clsx(
        'flex flex-col transition-all duration-300 z-30 h-screen sticky top-0 shrink-0',
        'bg-[#0F1117] border-r border-white/[0.06]',
        sidebarOpen ? 'w-64' : 'w-0 lg:w-[72px] overflow-hidden'
      )}
    >
      {/* ── Logo Header ── */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.06] shrink-0">
        <div className="h-9 w-9 rounded-xl bg-burgundy-900 border border-burgundy-700/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(107,29,47,0.4)]">
          <Logo size={22} />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-[13px] font-extrabold text-white tracking-wide leading-none">MangaFlow</p>
            <p className="text-[10px] font-semibold text-white/75 tracking-widest mt-0.5 uppercase font-mono">Mangaka</p>
          </div>
        )}
      </div>

      {/* ── User avatar strip ── */}
      {sidebarOpen && (
        <div className="mx-3 mt-4 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-burgundy-700 to-plum-900 flex items-center justify-center text-white text-xs font-black shrink-0 ring-2 ring-burgundy-600/30">
            {initials || 'MA'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-white/75 font-medium truncate">Current account</p>
          </div>
          <ChevronRight size={12} className="text-white/70 shrink-0" />
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem.toLowerCase() === item.name.toLowerCase();

          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              title={!sidebarOpen ? item.name : undefined}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group relative',
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/75 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              {/* Active left glow bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-burgundy-400 to-burgundy-700 shadow-[0_0_8px_rgba(185,28,28,0.6)]" />
              )}

              <Icon
                size={17}
                className={clsx(
                  'shrink-0 transition-colors',
                  isActive ? 'text-burgundy-400' : 'text-white/70 group-hover:text-white'
                )}
              />

              {sidebarOpen && (
                <span className="flex-1 text-left truncate">{item.name}</span>
              )}

              {sidebarOpen && item.badge !== undefined && (
                <span className={clsx(
                  'text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 leading-none',
                  item.badgeType === 'alert'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : item.badgeType === 'risk'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-white/10 text-white/60 border border-white/10'
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
