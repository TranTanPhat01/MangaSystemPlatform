import React, { useState } from 'react';
import { FileCode, Download, Trash2, ShieldAlert } from 'lucide-react';
import { MockFileItem } from '@/data/mock/files.mock';

interface FileListTableProps {
  files: MockFileItem[];
  onDownload: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export default function FileListTable({ files, onDownload, onDelete, isLoading }: FileListTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadClick = async (file: MockFileItem) => {
    if (isLoading) return;
    setDownloadingId(file.id);
    try {
      await onDownload(file.id, file.name);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Workspace Files</h3>
      </div>
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] uppercase font-bold text-slate-455 tracking-wider">
                <th className="p-4">File Name</th>
                <th className="p-4">Size</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-350">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                    No files found in workspace.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-250 flex items-center gap-2">
                      <FileCode size={16} className="text-slate-500 shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md block" title={file.name}>
                        {file.name}
                      </span>
                      {file.isMock && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                          <ShieldAlert size={8} />
                          Mock Data
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">{file.size}</td>
                    <td className="p-4 whitespace-nowrap">{file.uploader}</td>
                    <td className="p-4 whitespace-nowrap">{file.date}</td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadClick(file)}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={file.isMock ? "Mock download only" : "Download file"}
                      >
                        {downloadingId === file.id && isLoading ? (
                          <div className="h-3.5 w-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(file.id)}
                        className="p-1.5 hover:bg-slate-800 text-rose-455 hover:text-rose-350 rounded-md transition-colors"
                        title="Remove from view"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
