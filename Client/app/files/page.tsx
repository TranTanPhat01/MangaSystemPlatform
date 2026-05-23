'use client';

import React from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { FolderKanban, Upload, FileCode, Trash2, ExternalLink } from 'lucide-react';

const mockFiles = [
  { id: 1, name: 'ch43_draft_storyboard.pdf', size: '14.2 MB', uploader: 'Mangaka Oda', date: 'May 23, 2026' },
  { id: 2, name: 'ch43_backgrounds_inked.psd', size: '284.5 MB', uploader: 'Assistant Tanaka', date: 'May 22, 2026' },
];

export default function FilesPage() {
  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Asset Manager</h1>
            <p className="text-xs text-slate-500 font-medium">Upload drafts, screentones, and finalized PDF/PSD manuscripts.</p>
          </div>
        </div>

        {/* Drag and Drop Upload Card */}
        <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-8 text-center bg-slate-900/10 hover:bg-slate-900/20 transition-all cursor-pointer flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-450">
            <Upload size={20} />
          </div>
          <div>
            <span className="font-semibold text-sm text-slate-200 block">Click to upload assets</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Supports PSD, PDF, PNG, JPG (Max 500MB)</span>
          </div>
        </div>

        {/* Uploaded Files Table */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Workspace Files</h3>
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                    <th className="p-4">File Name</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Uploaded By</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-350">
                  {mockFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 font-semibold text-slate-250 flex items-center gap-2">
                        <FileCode size={16} className="text-slate-500" />
                        {file.name}
                      </td>
                      <td className="p-4">{file.size}</td>
                      <td className="p-4">{file.uploader}</td>
                      <td className="p-4">{file.date}</td>
                      <td className="p-4 text-right space-x-2">
                        <button className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors" title="Download">
                          <ExternalLink size={14} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-800 text-rose-450 hover:text-rose-350 rounded-md transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
