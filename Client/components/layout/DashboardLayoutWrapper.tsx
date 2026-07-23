'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { usePathname } from 'next/navigation';
import { useLogoutAction } from '@/lib/logout';
import Link from 'next/link';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  FolderKanban, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Heart
} from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import Logo from '@/components/mangaka/Logo';

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout, isLoggingOut } = useLogoutAction();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Return null on server/hydration to avoid unmount flash
  }

  // Get navigation links based on user roles
  const getNavLinks = () => {
    if (!user || !user.roles) return [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }];
    const roles = user.roles.map(r => r.toLowerCase());

    const links = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Reader', href: '/reader', icon: Heart }
    ];

    if (roles.includes('mangaka')) {
      links.push(
        { name: 'Series', href: '/series', icon: BookOpen },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Files', href: '/files', icon: FolderKanban }
      );
    }
    
    if (roles.includes('assistant')) {
      links.push(
        { name: 'My Tasks', href: '/tasks', icon: CheckSquare }
      );
    }

    if (roles.includes('tantoueditor') || roles.includes('editor')) {
      links.push(
        { name: 'Editorial Queue', href: '/editorial', icon: FileText }
      );
    }

    if (roles.includes('editorialboard') || roles.includes('board')) {
      links.push(
        { name: 'Editorial Decision', href: '/editorial', icon: FileText }
      );
    }

    if (roles.includes('admin')) {
      links.push(
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'System', href: '/admin/system', icon: Settings },
        { name: 'Manga Management', href: '/admin/manga', icon: BookOpen }
      );
    }

    return links;
  };

  const navLinks = getNavLinks();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname === '/reader' || pathname.startsWith('/reader/')) return 'Reader Profile';
    if (pathname.startsWith('/admin/users')) return 'User Management';
    if (pathname.startsWith('/admin/system')) return 'System Health';
    if (pathname.startsWith('/admin/manga')) return 'Manga Management';
    if (pathname.startsWith('/series')) return 'Series Management';
    if (pathname.startsWith('/tasks')) return 'Tasks & Workflow';
    if (pathname.startsWith('/editorial')) return 'Editorial Board';
    if (pathname.startsWith('/files')) return 'Asset Files';
    return 'MangaSystem';
  };

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-800 overflow-hidden font-sans antialiased">
      {/* Sidebar - Matching Premium Dark Style */}
      <aside className={clsx(
        'bg-[#0F1117] border-r border-white/[0.06] flex flex-col transition-all duration-300 z-30 h-screen sticky top-0 shrink-0',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-burgundy-900 border border-burgundy-700/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(107,29,47,0.4)]">
              <Logo size={22} />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden text-left">
                <p className="text-[13px] font-extrabold text-white tracking-wide leading-none">MangaFlow</p>
                <p className="text-[10px] font-semibold text-white/35 tracking-widest mt-0.5 uppercase font-mono">
                  {user?.roles?.[0] || 'Admin'}
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-white/[0.04] text-white/40 hover:text-white/80 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* User avatar strip */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-burgundy-700 to-plum-900 flex items-center justify-center text-white text-xs font-black shrink-0 ring-2 ring-burgundy-600/30">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-white truncate">{user?.fullName || 'User Profile'}</p>
              <p className="text-[10px] text-white/40 font-medium truncate capitalize font-mono">
                {user?.roles?.join(', ')}
              </p>
            </div>
            <ChevronRight size={12} className="text-white/20 shrink-0" />
          </div>
        )}

        {/* Sidebar Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-none">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.name}
                href={link.href}
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
                {sidebarOpen && <span className="truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Area - Matching Premium Light Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="flex flex-col shrink-0 text-left">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Workspace</p>
            <h2 className="text-sm font-black text-slate-800 leading-snug mt-0.5">
              Xin chào, {user?.fullName || 'User'}! 👋
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Profile Dropdown & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <button
                onClick={logout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 disabled:opacity-50"
              >
                <LogOut size={13} />
                <span>{isLoggingOut ? 'Signing Out…' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-7 bg-[#F4F6FA]">
          {children}
        </main>
      </div>
    </div>
  );
}
