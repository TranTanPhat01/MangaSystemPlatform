'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { 
  BookOpen, 
  CheckSquare, 
  FileText, 
  FolderKanban, 
  User, 
  Bell, 
  Zap,
  ChevronRight,
  TrendingUp,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const userRoles = user?.roles ? user.roles.map(r => r.toLowerCase()) : [];

  // Count active role configurations
  const isMangaka = userRoles.includes('mangaka');
  const isAssistant = userRoles.includes('assistant');
  const isEditor = userRoles.includes('tantoueditor');
  const isBoard = userRoles.includes('editorialboard');
  const isAdmin = userRoles.includes('admin');

  // Generate role-specific actions & greetings
  const getDashboardData = () => {
    if (isMangaka) {
      return {
        welcomeText: 'Welcome back, Sensei! Your drawing desk is ready.',
        description: 'Manage your manga series drafts, collaborate with your assistants, and review editor reviews.',
        stats: [
          { title: 'My Series', value: '2 Active', icon: BookOpen, color: 'text-violet-400' },
          { title: 'Pending Tasks', value: '4 Assigned', icon: CheckSquare, color: 'text-sky-400' },
          { title: 'Asset Files', value: '32 Uploaded', icon: FolderKanban, color: 'text-amber-400' },
          { title: 'Unread Alerts', value: unreadCount.toString(), icon: Bell, color: 'text-indigo-400' }
        ],
        shortcuts: [
          { label: 'Create New Series', href: '/series?action=new', desc: 'Register a new manga outline' },
          { label: 'Submit Chapter Draft', href: '/tasks?action=submit', desc: 'Send a chapter to editorial review' },
          { label: 'Upload Materials', href: '/files?action=upload', desc: 'Add drafts, PSDs, or screentone files' }
        ]
      };
    }
    
    if (isAssistant) {
      return {
        welcomeText: 'Welcome to the Studio, Assistant Creator!',
        description: 'Complete assigned drawings, clean screentones, and submit background assets for review.',
        stats: [
          { title: 'My Tasks', value: '3 Active', icon: CheckSquare, color: 'text-sky-400' },
          { title: 'Completed Tasks', value: '18 Total', icon: FileText, color: 'text-emerald-400' },
          { title: 'Unread Alerts', value: unreadCount.toString(), icon: Bell, color: 'text-indigo-400' }
        ],
        shortcuts: [
          { label: 'View Assigned Tasks', href: '/tasks', desc: 'Check drawing tasks allocated by your Mangaka' },
          { label: 'Submit Ink/Background', href: '/tasks?action=upload', desc: 'Deliver finalized assets to task list' }
        ]
      };
    }

    if (isEditor) {
      return {
        welcomeText: 'Welcome back, Chief Editor!',
        description: 'Review manga drafts, assign feedback instructions, and evaluate ranking logs.',
        stats: [
          { title: 'Assigned Authors', value: '5 Mangakas', icon: User, color: 'text-violet-400' },
          { title: 'Drafts to Review', value: '3 Pending', icon: FileText, color: 'text-rose-400' },
          { title: 'Unread Alerts', value: unreadCount.toString(), icon: Bell, color: 'text-indigo-400' }
        ],
        shortcuts: [
          { label: 'Review Submissions', href: '/editorial', desc: 'Inspect submitted drafts & give suggestions' },
          { label: 'Author Collaboration', href: '/tasks', desc: 'Assign creative tasks to assistants and mangakas' }
        ]
      };
    }

    if (isBoard) {
      return {
        welcomeText: 'Editorial Board Operations Dashboard',
        description: 'Monitor overall publishing schedules, evaluate monthly metrics, and review series rankings.',
        stats: [
          { title: 'Active Series', value: '14 Board-wide', icon: BookOpen, color: 'text-violet-400' },
          { title: 'Monthly Rankings', value: 'Calculated', icon: TrendingUp, color: 'text-emerald-400' },
          { title: 'Unread Alerts', value: unreadCount.toString(), icon: Bell, color: 'text-indigo-400' }
        ],
        shortcuts: [
          { label: 'Editorial Management', href: '/editorial', desc: 'Manage official manga series listings' },
          { label: 'Calculate Rankings', href: '/editorial?tab=rankings', desc: 'Process and announce monthly popularity polls' }
        ]
      };
    }

    if (isAdmin) {
      return {
        welcomeText: 'Platform Administrative Control Panel',
        description: 'Configure microservices gateway routing, manage platform users, and review database sync logs.',
        stats: [
          { title: 'Platform Users', value: '18 Registered', icon: User, color: 'text-violet-400' },
          { title: 'API Gateway Status', value: 'Healthy (5200)', icon: FileCode, color: 'text-emerald-400' },
          { title: 'System Alerts', value: '0 Active', icon: ShieldAlert, color: 'text-emerald-400' }
        ],
        shortcuts: [
          { label: 'Platform Users List', href: '/dashboard?tab=users', desc: 'Review, modify, or block system user roles' },
          { label: 'API Gateway Configurations', href: '/dashboard?tab=system', desc: 'View routing clusters & connections' }
        ]
      };
    }

    // Default or Fallback
    return {
      welcomeText: 'Welcome to MangaSystemPlatform',
      description: 'Choose an option from the sidebar to begin navigation.',
      stats: [
        { title: 'Unread Alerts', value: unreadCount.toString(), icon: Bell, color: 'text-indigo-400' }
      ],
      shortcuts: []
    };
  };

  const data = getDashboardData();

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 border border-slate-800/60 p-6 md:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-450 mb-4 border border-indigo-500/20">
              <Zap size={12} />
              MangaSystem Active Session
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">
              {data.welcomeText}
            </h1>
            <p className="text-sm md:text-md text-slate-400 leading-relaxed font-medium">
              {data.description}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div 
                key={i}
                className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-5 flex items-center justify-between hover:border-slate-800 hover:bg-slate-900 transition-all duration-200"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-xl font-bold text-slate-200">
                    {stat.value}
                  </h3>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-slate-855 flex items-center justify-center ${stat.color} border border-slate-800/80`}>
                  <Icon size={20} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Shortcuts / Quick Actions */}
        {data.shortcuts.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-slate-500 tracking-wider uppercase">
              Quick Actions Shortcuts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {data.shortcuts.map((shortcut, i) => (
                <Link 
                  key={i}
                  href={shortcut.href}
                  className="group flex flex-col justify-between p-5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700/60 transition-all duration-200 text-left animate-in fade-in duration-300"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors mb-1">
                      {shortcut.label}
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal mb-4">
                      {shortcut.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-indigo-300 transition-all">
                    Get Started
                    <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}
