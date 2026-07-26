import React from 'react';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, 
  FileText, 
  Newspaper,
  Vote, 
  Calendar, 
  BarChart2, 
  Trophy, 
  AlertTriangle, 
  History, 
  PieChart, 
  Settings, 
  ShieldCheck, 
  ChevronRight, 
  HardDrive 
} from 'lucide-react';
import { ActiveNav } from '@/types/board';

const NAV_ITEMS: { name: ActiveNav; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Series Proposals', icon: FileText },
  { name: 'Issue Management', icon: Newspaper },
  { name: 'Board Voting', icon: Vote },
  { name: 'Publication Schedule', icon: Calendar },
  { name: 'Reader Voting', icon: BarChart2 },
  { name: 'Rankings', icon: Trophy },
  { name: 'Cancellation Review', icon: AlertTriangle },
  { name: 'Decision History', icon: History },
  { name: 'Reports', icon: PieChart },
  { name: 'Settings', icon: Settings },
];

interface BoardSidebarProps {
  active: ActiveNav;
  onNavigate: (n: ActiveNav) => void;
  open: boolean;
}

export default function BoardSidebar({ active, onNavigate, open }: BoardSidebarProps) {
  return (
    <aside
      className={clsx(
        'flex flex-col h-screen sticky top-0 shrink-0 bg-[#100C1C] border-r border-white/[0.06] transition-all duration-300 z-30',
        open ? 'w-64' : 'w-0 lg:w-[72px] overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.06] shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-burgundy-700 to-plum-800 flex items-center justify-center shrink-0 shadow-lg shadow-plum-900/40 border border-white/10">
          <ShieldCheck size={18} className="text-white" />
        </div>
        {open && (
          <div>
            <p className="text-[13px] font-extrabold text-white tracking-wide leading-none">MangaFlow</p>
            <p className="text-[9px] font-bold text-white/75 tracking-widest mt-0.5 uppercase font-mono">Editorial Board</p>
          </div>
        )}
      </div>

      {/* User strip */}
      {open && (
        <div className="mx-3 mt-4 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-plum-600 to-burgundy-800 flex items-center justify-center text-white text-[10px] font-black shrink-0 ring-2 ring-plum-600/30">
            HT
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">Hiroshi Tanaka</p>
            <p className="text-[9px] text-white/75 font-medium truncate">Editorial Board</p>
          </div>
          <ChevronRight size={11} className="text-white/70 shrink-0" />
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
                  : 'text-white/75 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-plum-400 to-burgundy-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              )}
              <Icon
                size={17}
                className={clsx(
                  'shrink-0 transition-colors',
                  isActive ? 'text-plum-400' : 'text-white/70 group-hover:text-white'
                )}
              />
              {open && <span className="flex-1 text-left truncate">{name}</span>}
              {open && name === 'Series Proposals' && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-plum-500/20 text-plum-300 border border-plum-500/30">7</span>
              )}
              {open && name === 'Cancellation Review' && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">3</span>
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
              <HardDrive size={11} className="text-white/70" />
              <span className="text-[9px] font-semibold text-white/75 uppercase tracking-wider">Storage</span>
            </div>
            <span className="text-[9px] font-bold text-white/75">64%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-plum-700 to-plum-400" />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] font-bold text-white/50">128 GB</span>
            <span className="text-[9px] text-white/75">/ 200 GB</span>
          </div>
        </div>
      )}
    </aside>
  );
}
