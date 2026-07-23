import React from 'react';
import { MessageSquare, User, FileWarning } from 'lucide-react';

interface EditorialFeedbackCardProps {
  chapter: string;
  editorName: string;
  status: string;
  note?: string;
  onViewFeedback: () => void;
}

export default function EditorialFeedbackCard({
  chapter,
  editorName,
  status,
  note,
  onViewFeedback,
}: EditorialFeedbackCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-burgundy-50/10 border border-burgundy-100 rounded-xl p-5 shadow-[0_2px_8px_rgba(107,29,47,0.03)] flex flex-col justify-between h-full">
      <div>
        {/* Card Title */}
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-burgundy-100/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <FileWarning size={16} className="text-burgundy-700" />
            <span>Editorial Review Alert</span>
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-burgundy-100 text-burgundy-850 border border-burgundy-200/50">
            {status}
          </span>
        </div>

        {/* Chapter & Editor Info */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-800">
            {chapter}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-550 font-medium">
            <User size={13} className="text-slate-400" />
            <span>Editor: <span className="font-semibold text-slate-700">{editorName}</span></span>
          </div>
        </div>

        {/* Feedback note text box */}
        <div className="p-3 bg-white/60 border border-burgundy-100/40 rounded-lg mb-4 text-xs text-slate-650 leading-relaxed font-medium italic relative">
          <MessageSquare size={12} className="absolute top-2.5 right-2.5 text-burgundy-300" />
          &quot;{note}&quot;
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onViewFeedback}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-burgundy-900 bg-burgundy-50 border border-burgundy-200/80 hover:bg-burgundy-100 active:bg-burgundy-200 transition-all duration-150 shadow-sm"
      >
        <span>View Full Feedback</span>
      </button>
    </div>
  );
}
