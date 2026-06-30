'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  FolderKanban, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  User, 
  Menu, 
  X
} from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Get navigation links based on user roles
  const getNavLinks = () => {
    if (!user || !user.roles) return [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }];
    const roles = user.roles.map(r => r.toLowerCase());

    const links = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
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

    if (roles.includes('tantoueditor')) {
      links.push(
        { name: 'Editorial', href: '/editorial', icon: FileText }
      );
    }

    if (roles.includes('editorialboard')) {
      links.push(
        { name: 'Editorial', href: '/editorial', icon: FileText }
      );
    }

    if (roles.includes('admin')) {
      links.push(
        { name: 'Users', href: '/dashboard?tab=users', icon: Users },
        { name: 'System', href: '/dashboard?tab=system', icon: Settings }
      );
    }

    return links;
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.startsWith('/series')) return 'Series Management';
    if (pathname.startsWith('/tasks')) return 'Tasks & Workflow';
    if (pathname.startsWith('/editorial')) return 'Editorial Board';
    if (pathname.startsWith('/files')) return 'Asset Files';
    return 'MangaSystem';
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-slate-900/90 border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-indigo-500/20">
              M
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-lg tracking-wider bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent truncate font-sans">
                MangaSystem
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {sidebarOpen && <span className="truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Info) */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
              <User size={18} className="text-slate-300" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-250 truncate">{user?.fullName || 'User Profile'}</p>
                <p className="text-xs text-slate-500 truncate capitalize font-mono">
                  {user?.roles?.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/60 px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg text-slate-250">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Profile Dropdown & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
              >
                <LogOut size={14} />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}
