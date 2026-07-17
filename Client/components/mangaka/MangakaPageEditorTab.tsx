import React from 'react';
import { Layers } from 'lucide-react';

interface MangakaPageEditorTabProps {
  setActiveTab: (tab: string) => void;
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaPageEditorTab({ setActiveTab, triggerModal }: MangakaPageEditorTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Visual Page Editor & Sequence Manager</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Review drawing bounds, panels layout, dialog box pacing, and arrange page sequences.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm">
        <div className="h-16 w-16 bg-plum-50 border border-plum-100 text-plum-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No Page Workspace Open</h3>
        <p className="text-sm text-slate-500 font-semibold mt-1.5 max-w-md mx-auto">
          Select a page from the active chapter production list or click a Review action in the Task Board to open the visual layout and dialog placement canvas.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button 
            onClick={() => setActiveTab('Dashboard')}
            className="px-4 py-2 text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-900 rounded-lg transition-colors"
          >
            Go to Task Board
          </button>
          <button 
            onClick={() => triggerModal("Launch Editor Sandbox", "Open drawing canvas sandbox. Import raw pencil sketches, arrange comic frames, lay down base color fill layers, or type dialogue outlines to experiment.")}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Launch Editor Sandbox
          </button>
        </div>
      </div>
    </div>
  );
}
