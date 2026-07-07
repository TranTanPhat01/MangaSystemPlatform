'use client';
import React, { useState } from 'react';
import { Search, Bell, Menu, User, LogOut, Settings, HelpCircle, Plus, Upload, ChevronDown, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardHeaderProps {
  user: {
    name: string;
    avatarUrl?: string;
    role: string;
  };
  notificationsCount: number;
  onSearch?: (query: string) => void;
  onToggleSidebar?: () => void;
}

export default function DashboardHeader({
  user,
  notificationsCount,
  onSearch,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 flex items-center gap-4 shrink-0 sticky top-0 z-20 shadow-[0_1px_0_rgba(0,0,0,0.04)]">

      {/* Mobile Toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 lg:hidden transition-colors shrink-0"
        title="Toggle Sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Greeting (desktop) */}
      <div className="hidden sm:flex flex-col shrink-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Workspace</p>
        <h2 className="text-sm font-black text-slate-800 leading-snug mt-0.5">
          Xin chào, {user.name}! 👋
        </h2>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-auto">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-350 group-focus-within:text-burgundy-600 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm series, chapter, trang… (Ctrl+K)"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-8.5 pr-4 text-xs font-medium text-slate-700 placeholder-slate-350 focus:outline-none focus:bg-white focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/10 transition-all"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">

        {/* CTA buttons (desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 group">
            <Plus size={13} className="text-slate-400 group-hover:text-burgundy-600 transition-colors" />
            New Series
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 group">
            <Sparkles size={13} className="text-slate-400 group-hover:text-plum-600 transition-colors" />
            New Chapter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-burgundy-800 text-xs font-bold text-white hover:bg-burgundy-900 shadow-[0_2px_8px_rgba(107,29,47,0.2)] hover:shadow-[0_4px_12px_rgba(107,29,47,0.3)] transition-all duration-200 active:scale-[0.98]">
            <Upload size={13} />
            Upload Page
          </button>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all duration-150"
          title="Notifications"
        >
          <Bell size={17} className="stroke-[2]" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-burgundy-600 text-[8px] font-black text-white flex items-center justify-center border-2 border-white">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-150"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-burgundy-700 to-plum-900 flex items-center justify-center text-white text-[11px] font-black ring-2 ring-burgundy-200 shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Mangaka</p>
            </div>
            <ChevronDown size={12} className={clsx('text-slate-400 transition-transform duration-200 hidden md:block', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-800">{user.name}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">{user.role}</p>
                </div>
                {[
                  { icon: User, label: 'My Profile' },
                  { icon: Settings, label: 'Account Settings' },
                  { icon: HelpCircle, label: 'Support & Docs' },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => setDropdownOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <Icon size={13} className="text-slate-400" />
                    {label}
                  </button>
                ))}
                <div className="border-t border-slate-50 pt-1.5 mt-1 px-2">
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
