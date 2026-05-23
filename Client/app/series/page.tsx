'use client';

import React from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { BookOpen, Plus, Calendar, Clock, Award, Star } from 'lucide-react';

const mockSeries = [
  { id: 1, title: 'Shadow Syndicate', status: 'Ongoing', chapters: 42, rating: 4.8, type: 'Weekly Shonen', releaseDay: 'Monday' },
  { id: 2, title: 'Whisper of the Wind', status: 'Hiatus', chapters: 18, rating: 4.5, type: 'Monthly Seinen', releaseDay: '25th Monthly' },
];

export default function SeriesPage() {
  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Manga Series</h1>
            <p className="text-xs text-slate-500 font-medium">Create, publish, and track serialization pipelines of registered titles.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all duration-200">
            <Plus size={14} />
            Add Series
          </button>
        </div>

        {/* Series Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mockSeries.map((series) => (
            <div 
              key={series.id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-250 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    series.status === 'Ongoing' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                  }`}>
                    {series.status}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
                    <Star size={12} fill="currentColor" />
                    {series.rating}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-1">{series.title}</h3>
                <p className="text-xs text-slate-500 mb-4">{series.type}</p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-3 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <BookOpen size={14} className="text-slate-500" />
                    <span>{series.chapters} Chapters</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={14} className="text-slate-500" />
                    <span>{series.releaseDay}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Last updated 2 days ago</span>
                <button className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                  Manage Details &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
