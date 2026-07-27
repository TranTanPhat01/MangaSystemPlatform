import React from 'react';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileImage, 
  Upload, 
  RotateCcw, 
  FolderOpen, 
  DollarSign, 
  Bell, 
  Settings, 
  Layers, 
  ChevronRight, 
  HardDrive 
} from 'lucide-react';
import { ActiveNav } from '@/types/assistant';
import { useAuthStore } from '@/store/auth-store';

const NAV_ITEMS: { name: ActiveNav; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', icon: CheckSquare },
  { name: 'Assigned Pages', icon: FileImage },
  { name: 'Submissions', icon: Upload },
  { name: 'Revision Requests', icon: RotateCcw },
  { name: 'Files & Assets', icon: FolderOpen },
  { name: 'Earnings', icon: DollarSign },
  { name: 'Notifications', icon: Bell },
  { name: 'Settings', icon: Settings },
];

interface AssistantSidebarProps {
  active: ActiveNav;
  onNavigate: (n: ActiveNav) => void;
  open: boolean;
}

export default function AssistantSidebar({ active, onNavigate, open }: AssistantSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || 'Assistant';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <aside
      className={clsx(
        'flex flex-col h-screen sticky top-0 shrink-0 bg-[#0E0A1C] border-r border-white/[0.05] transition-all duration-300 z-30',
        open ? 'w-64' : 'w-0 lg:w-[72px] overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.05] shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-800 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/40 border border-white/10">
          <Layers size={18} className="text-white" />
        </div>
        {open && (
          <div>
            <p className="text-[13px] font-extrabold text-white tracking-wide leading-none">MangaFlow</p>
            <p className="text-[9px] font-bold text-white/30 tracking-widest mt-0.5 uppercase font-mono">Assistant</p>
          </div>
        )}
      </div>

      {/* User strip */}
      {open && (
        <div className="mx-3 mt-4 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-750 flex items-center justify-center text-white text-[10px] font-black shrink-0 ring-2 ring-indigo-550/30">
            {initials || 'AS'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{displayName}</p>
            <p className="text-[9px] text-white/35 font-medium truncate">Assistant</p>
          </div>
          <ChevronRight size={11} className="text-white/20 shrink-0" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ name, icon: Icon }) => {
          const isActive = active === name;
          return (
            <button
              key={name}
              onClick={() => onNavigate(name)}
              title={!open ? name : undefined}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group relative',
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              )}
              <Icon
                size={17}
                className={clsx(
                  'shrink-0 transition-colors',
                  isActive ? 'text-indigo-400' : 'text-white/30 group-hover:text-white/60'
                )}
              />
              {open && <span className="flex-1 text-left truncate">{name}</span>}
              {open && name === 'My Tasks' && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">2</span>
              )}
              {open && name === 'Revision Requests' && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">2</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage bar */}
      {open && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <HardDrive size={11} className="text-white/30" />
              <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Storage</span>
            </div>
            <span className="text-[9px] font-bold text-white/40">—</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div className="h-full w-0 rounded-full bg-gradient-to-r from-indigo-700 to-indigo-400" />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] font-bold text-white/50">Storage API unavailable</span>
          </div>
        </div>
      )}
    </aside>
  );
}
