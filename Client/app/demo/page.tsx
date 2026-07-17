'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Pencil,
  Users,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Star,
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Role Data ────────────────────────────────────────────────────────────────
interface RoleCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  route: string;
  available: boolean;
  accentFrom: string;
  accentTo: string;
  iconBg: string;
  badgeColor: string;
  features: string[];
  stat: { value: string; label: string };
}

const ROLES: RoleCard[] = [
  {
    id: 'mangaka',
    title: 'Mangaka',
    subtitle: 'Chief Artist',
    description:
      'The creative core of MangaFlow. Mangaka manage their series lifecycle — from crafting new chapter drafts and uploading page artwork to tracking revision tasks and monitoring chapter performance in real-time.',
    icon: Pencil,
    route: '/dashboard',
    available: true,
    accentFrom: 'from-burgundy-700',
    accentTo: 'to-plum-900',
    iconBg: 'bg-gradient-to-br from-burgundy-600 to-plum-800',
    badgeColor: 'text-burgundy-700 bg-burgundy-50 border-burgundy-200',
    features: [
      'Series & chapter management',
      'Page artwork upload & previews',
      'Task board with revision tracking',
      'Performance analytics',
      'Notification center',
    ],
    stat: { value: '24', label: 'Active series' },
  },
  {
    id: 'assistant',
    title: 'Assistant',
    subtitle: 'Editorial Assistant',
    description:
      'Assistants bridge the gap between Mangaka and editors. They coordinate manuscript handoffs, flag issues, manage file deliveries, and ensure chapter submissions meet editorial standards before escalation.',
    icon: Users,
    route: '/assistant',
    available: true,
    accentFrom: 'from-indigo-600',
    accentTo: 'to-violet-900',
    iconBg: 'bg-gradient-to-br from-indigo-600 to-violet-800',
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    features: [
      'Manuscript handoff coordination',
      'Issue flagging & escalation',
      'File delivery management',
      'Pre-submission quality checks',
      'Communication hub',
    ],
    stat: { value: '12', label: 'Active tasks' },
  },
  {
    id: 'tantou',
    title: 'Tantou Editor',
    subtitle: 'Series Editor-in-Charge',
    description:
      'Tantou Editors are responsible for each series under their charge. They review submitted manuscripts, provide structured editorial feedback, approve chapters for publication, and process weekly popularity rankings.',
    icon: BookOpen,
    route: '/editorial',
    available: true,
    accentFrom: 'from-teal-600',
    accentTo: 'to-emerald-900',
    iconBg: 'bg-gradient-to-br from-teal-600 to-emerald-800',
    badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
    features: [
      'Manuscript review queue',
      'Structured editorial feedback',
      'Chapter approval workflow',
      'Weekly popularity rankings',
      'Creator collaboration tools',
    ],
    stat: { value: '8', label: 'Series in charge' },
  },
  {
    id: 'board',
    title: 'Editorial Board',
    subtitle: 'Publishing Decision Authority',
    description:
      'The Editorial Board holds the highest decision-making authority. They evaluate new series proposals, cast board votes, set publication schedules, input reader voting results, monitor rankings, and decide the fate of low-performing series.',
    icon: ShieldCheck,
    route: '/board',
    available: true,
    accentFrom: 'from-plum-700',
    accentTo: 'to-burgundy-900',
    iconBg: 'bg-gradient-to-br from-plum-600 to-burgundy-800',
    badgeColor: 'text-plum-700 bg-plum-50 border-plum-200',
    features: [
      'Series proposal review & voting',
      'Publication schedule management',
      'Reader voting input & tracking',
      'Rankings & cancellation review',
      'Board decision history',
    ],
    stat: { value: '7', label: 'Pending proposals' },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RoleDemoShowcasePage() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F4F6FA] font-sans antialiased">
      {/* ── Subtle dot grid background ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(107,29,47,0.05) 1.5px, transparent 1.5px)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* ── Top Nav Bar ── */}
      <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04)] flex items-center px-6 md:px-10 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-burgundy-700 to-plum-900 flex items-center justify-center shadow-[0_2px_8px_rgba(107,29,47,0.25)]">
            <Layers size={16} className="text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-extrabold text-slate-800 tracking-tight">MangaFlow</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Platform</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border border-plum-200 bg-plum-50 text-plum-700">
            <Star size={10} className="fill-plum-500 text-plum-500" />
            Role Showcase · v1.0
          </span>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-150"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative max-w-7xl mx-auto px-5 md:px-8 pb-20">

        {/* ── Hero Section ── */}
        <div className="text-center pt-14 pb-12 max-w-3xl mx-auto">
          {/* Eyebrow tag */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-500 shadow-sm uppercase tracking-widest mb-5">
            <Sparkles size={10} className="text-plum-500" />
            Interactive Dashboard Showcase
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
            MangaFlow{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-burgundy-600 to-plum-600">
              Role-based
            </span>{' '}
            Dashboard Showcase
          </h1>

          <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed">
            Explore the dedicated workspace for each role in the manga creation and publishing workflow.
            <br className="hidden md:block" />
            Each dashboard is purpose-built for a distinct set of responsibilities.
          </p>

          {/* Stats row */}
          <div className="mt-8 inline-flex flex-wrap justify-center gap-x-8 gap-y-3 px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            {[
              { value: '4', label: 'Role Dashboards' },
              { value: '4', label: 'Live & Interactive' },
              { value: '0', label: 'Coming Soon' },
            ].map(s => (
              <div key={s.label} className="text-center px-4">
                <p className="text-2xl font-black text-slate-800">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Role Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLES.map((role, index) => {
            const Icon = role.icon;
            const isHovered = hovered === role.id;

            return (
              <div
                key={role.id}
                onMouseEnter={() => setHovered(role.id)}
                onMouseLeave={() => setHovered(null)}
                className={clsx(
                  'group relative bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all duration-300',
                  isHovered
                    ? 'shadow-[0_12px_40px_rgba(0,0,0,0.10)] -translate-y-1'
                    : 'shadow-[0_2px_16px_rgba(0,0,0,0.05)]',
                  !role.available && 'opacity-90'
                )}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* ── Card accent gradient strip ── */}
                <div
                  className={clsx(
                    'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500',
                    role.accentFrom, role.accentTo,
                    isHovered ? 'opacity-100' : 'opacity-50'
                  )}
                />

                {/* ── Card inner ── */}
                <div className="p-7">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      {/* Icon bubble */}
                      <div
                        className={clsx(
                          'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300',
                          role.iconBg,
                          isHovered && 'scale-110'
                        )}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">{role.title}</h2>
                          {!role.available && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className={clsx('text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex', role.badgeColor)}>
                          {role.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Stat chip */}
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xl font-black text-slate-800 leading-none">{role.stat.value}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider whitespace-nowrap">{role.stat.label}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                    {role.description}
                  </p>

                  {/* Feature list */}
                  <div className="space-y-2 mb-7">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Key Capabilities</p>
                    {role.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 mb-5" />

                  {/* CTA */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {role.available ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600">Live & Interactive</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-600">In Development</span>
                        </>
                      )}
                    </div>

                    {role.available ? (
                      <Link
                        href={role.route}
                        className={clsx(
                          'group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white',
                          'bg-gradient-to-r shadow-md transition-all duration-200',
                          'active:scale-[0.97] hover:shadow-lg',
                          role.accentFrom, role.accentTo,
                          'hover:opacity-90'
                        )}
                      >
                        Open Dashboard
                        <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-200 group-hover/btn:translate-x-0.5">
                          <ChevronRight size={11} />
                        </span>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                      >
                        Coming Soon
                        <Clock size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Hover glow overlay */}
                <div
                  className={clsx(
                    'absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    background:
                      'radial-gradient(ellipse at 80% 0%, rgba(139,92,246,0.04) 0%, transparent 70%)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Bottom Info Banner ── */}
        <div className="mt-10 bg-gradient-to-r from-[#100C1C] to-plum-950 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_8px_32px_rgba(88,28,135,0.2)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-plum-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-plum-300">MangaFlow Platform</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-1">
              Manga Creation & Publishing Management System
            </h2>
            <p className="text-sm text-white/50 font-medium max-w-xl">
              A full-stack workflow platform connecting creators, editors, and publishing decision-makers
              under one unified system. Built with Next.js App Router, TypeScript, and SignalR real-time updates.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
            >
              <Pencil size={13} />Mangaka WS
            </Link>
            <Link
              href="/board"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-plum-600 border border-plum-500 text-white text-xs font-bold hover:bg-plum-500 transition-colors shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
            >
              <ShieldCheck size={13} />Editorial Board
            </Link>
          </div>
        </div>

        {/* ── Route Map ── */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700">Route Map</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">All available dashboard routes in this project</p>
          </div>
          <div className="divide-y divide-slate-50">
            {ROLES.map(role => {
              const Icon = role.icon;
              return (
                <div key={role.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors group">
                  <div className={clsx('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', role.iconBg)}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{role.title}</p>
                    <p className="text-[9px] font-medium text-slate-400">{role.subtitle}</p>
                  </div>
                  <code className="text-[10px] font-mono font-bold text-plum-700 bg-plum-50 border border-plum-100 px-2.5 py-1 rounded-lg">
                    {role.route}
                  </code>
                  {role.available ? (
                    <Link
                      href={role.route}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-plum-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink size={11} />Open
                    </Link>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-500 opacity-60">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
