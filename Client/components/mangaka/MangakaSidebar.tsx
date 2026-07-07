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
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { clsx } from 'clsx';
import Logo from './Logo';

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
}

const STORAGE_USED_GB = 128.4;
const STORAGE_TOTAL_GB = 200;
const storagePercent = Math.round((STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100);

export default function MangakaSidebar({
  activeItem,
  onNavigate,
  sidebarOpen = true,
}: MangakaSidebarProps) {
  const menuItems: SidebarItem[] = [
    { name: 'Dashboard',         icon: LayoutDashboard },
    { name: 'My Series',         icon: BookOpen,      badge: 4,       badgeType: 'count' },
    { name: 'Chapters',          icon: Layers,        badge: 3,       badgeType: 'count' },
    { name: 'Page Editor',       icon: Feather },
    { name: 'Tasks',             icon: CheckSquare,   badge: 18,      badgeType: 'count' },
    { name: 'Files',             icon: FolderKanban },
    { name: 'Editorial Reviews', icon: FileText,      badge: 'Alert', badgeType: 'alert' },
    { name: 'Rankings',          icon: Trophy,        badge: 'Risk',  badgeType: 'risk' },
    { name: 'Notifications',     icon: Bell,          badge: 5,       badgeType: 'count' },
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
            <p className="text-[10px] font-semibold text-white/35 tracking-widest mt-0.5 uppercase font-mono">Mangaka</p>
          </div>
        )}
      </div>

      {/* ── User avatar strip ── */}
      {sidebarOpen && (
        <div className="mx-3 mt-4 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-burgundy-700 to-plum-900 flex items-center justify-center text-white text-xs font-black shrink-0 ring-2 ring-burgundy-600/30">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Akira Sato</p>
            <p className="text-[10px] text-white/40 font-medium truncate">Chief Artist</p>
          </div>
          <ChevronRight size={12} className="text-white/20 shrink-0" />
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
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
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
                  isActive ? 'text-burgundy-400' : 'text-white/30 group-hover:text-white/60'
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

      {/* ── Storage Bar ── */}
      {sidebarOpen && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <HardDrive size={12} className="text-white/30" />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Storage</span>
            </div>
            <span className="text-[10px] font-bold text-white/50">{storagePercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-700',
                storagePercent > 85
                  ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                  : 'bg-gradient-to-r from-burgundy-700 to-burgundy-400'
              )}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] font-bold text-white/60">{STORAGE_USED_GB} GB</span>
            <span className="text-[10px] text-white/25">/ {STORAGE_TOTAL_GB} GB</span>
          </div>
        </div>
      )}
    </aside>
  );
}
