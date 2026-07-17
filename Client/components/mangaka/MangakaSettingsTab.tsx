import React from 'react';

interface MangakaSettingsTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaSettingsTab({ triggerModal }: MangakaSettingsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Studio Profile & Integration Settings</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Configure workspace parameters, notification thresholds, and publisher credentials.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm max-w-2xl">
        <h3 className="font-bold text-slate-800 text-sm mb-4 pb-1 border-b border-slate-100">Studio Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-655 mb-1">Manga Creator Nickname</label>
            <input type="text" defaultValue="Akira" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-burgundy-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-655 mb-1">Serialization Publisher ID</label>
            <input type="text" defaultValue="PUB-SHONEN-9021" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-burgundy-500 font-mono" />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <h4 className="text-xs font-bold text-slate-755">SMS Notification Alert</h4>
              <p className="text-[10px] text-slate-450 mt-0.5">Receive immediate notifications on your phone for urgent editor reviews.</p>
            </div>
            <input type="checkbox" defaultChecked className="accent-burgundy-800" />
          </div>

          <div className="flex justify-end pt-3">
            <button 
              onClick={() => triggerModal("Save Settings", "Manga studio preferences successfully stored in workspace storage profile.")}
              className="px-4 py-2 text-xs font-bold text-white bg-burgundy-800 hover:bg-burgundy-900 rounded-lg transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
