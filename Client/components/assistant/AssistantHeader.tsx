import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useLogoutAction } from '@/lib/logout';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { useAuthStore } from '@/store/auth-store';
import { 
  Menu, 
  Search, 
  Download, 
  Upload, 
  HelpCircle, 
  Bell, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface AssistantHeaderProps {
  onToggleSidebar: () => void;
}

export default function AssistantHeader({ onToggleSidebar }: AssistantHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || 'Assistant';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const { logout, isLoggingOut } = useLogoutAction();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 flex items-center gap-4 shrink-0 sticky top-0 z-20 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors shrink-0 lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="hidden sm:flex flex-col shrink-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assistant Dashboard</p>
        <h2 className="text-sm font-black text-slate-800 leading-snug mt-0.5">Chào ngày mới, {displayName}! 👋</h2>
      </div>

      <div className="flex-1 max-w-sm mx-auto">
        <div className="relative group">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-650 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm task, series, chapter… (Ctrl+K)"
            className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-8 pr-4 text-xs font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <div className="hidden lg:flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 group">
            <Download size={13} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            Download Assets
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-700 text-xs font-bold text-white hover:bg-indigo-800 shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition-all duration-200 active:scale-[0.98]">
            <Upload size={13} />
            Upload Submission
          </button>
        </div>

        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all">
          <HelpCircle size={17} />
        </button>

        <NotificationDropdown />

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-white text-[11px] font-black ring-2 ring-indigo-200 shrink-0">
              {initials || 'AS'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{displayName}</p>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Assistant</p>
            </div>
            <ChevronDown
              size={12}
              className={clsx(
                'text-slate-400 transition-transform duration-200 hidden md:block',
                profileOpen && 'rotate-180'
              )}
            />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-800">{displayName}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Assistant</p>
                </div>
                {[
                  { icon: User, label: 'My Profile' },
                  { icon: Settings, label: 'Account Settings' },
                  { icon: HelpCircle, label: 'Support & Docs' },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <Icon size={13} className="text-slate-400" />
                    {label}
                  </button>
                ))}
                <div className="border-t border-slate-50 pt-1.5 mt-1 px-2">
                  <button
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors disabled:opacity-50"
                  >
                    <LogOut size={13} />
                    {isLoggingOut ? 'Signing Out…' : 'Sign Out'}
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
