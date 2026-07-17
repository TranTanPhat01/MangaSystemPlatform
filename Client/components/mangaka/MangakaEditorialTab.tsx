import React from 'react';
import EditorialFeedbackCard from './EditorialFeedbackCard';

interface MangakaEditorialTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaEditorialTab({ triggerModal }: MangakaEditorialTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Editorial Feedback Log</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Review feedback, requested changes, and direct communication history with Chief Editor Sato.</p>
      </div>

      <div className="space-y-4">
        <EditorialFeedbackCard
          chapter="Chapter 11: Final Edits"
          editorName="Sato"
          status="Revision Required"
          note="Dialogue pacing on page 7 needs improvement. Break up Akira's second panel bubble."
          onViewFeedback={() => triggerModal("Editorial Feedback: Chapter 11", "Dialogue spacing issue in Panel 2 of Page 7. Editor Sato notes: 'The dramatic payoff is lost because Akira's bubble is crowded. Suggest splitting the dialog block into two separate text elements.'")}
        />
        
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-700">Past Feedback Archive</span>
            <span className="text-xs text-slate-400 font-semibold">2 archived entries</span>
          </div>
          <div className="space-y-3.5">
            {[
              { ch: 'Chapter 10: Across the Abyss', editor: 'Sato', verdict: 'Approved', note: 'Line art is sharp. Page 12 panels have excellent speed line effects.' },
              { ch: 'Chapter 09: Storm Warning', editor: 'Sato', verdict: 'Approved', note: 'Script approved without corrections. Drafting can begin.' }
            ].map((arch, i) => (
              <div key={i} className="text-xs border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center font-bold text-slate-700">
                  <span>{arch.ch}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{arch.verdict}</span>
                </div>
                <p className="text-slate-500 mt-1 font-semibold">Editor: {arch.editor} • "{arch.note}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
