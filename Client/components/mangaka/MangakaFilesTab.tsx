import React from 'react';
import { Upload, FolderKanban } from 'lucide-react';
import { FILES } from '@/data/mock/mangaka.mock';

interface MangakaFilesTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaFilesTab({ triggerModal }: MangakaFilesTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Studio Asset Manager</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Storage vault for comic pages, character concept design sketches, vector panels, PSD files, and exports.</p>
        </div>
        <button 
          onClick={() => triggerModal("Upload File Asset", "Drag and drop drawing files (.clip, .psd, .png) or text files (.txt, .docx, .md) to upload.")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-plum-700 hover:bg-plum-800 active:bg-plum-900 transition-colors shadow-sm"
        >
          <Upload size={14} />
          <span>Upload Assets</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {FILES.map((file, i) => (
          <div key={i} className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs hover:border-burgundy-200 transition-colors flex flex-col justify-between">
            <div className="h-10 w-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shrink-0">
              <FolderKanban size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-750 truncate" title={file.name}>
                {file.name}
              </h4>
              <p className="text-[10px] text-slate-455 font-semibold mt-0.5">
                {file.type} • {file.size}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>{file.date}</span>
              <button 
                onClick={() => triggerModal(`Open File: ${file.name}`, `Downloading or launching external studio tool for visual asset file: "${file.name}".`)}
                className="text-burgundy-855 hover:text-burgundy-950 font-extrabold"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
