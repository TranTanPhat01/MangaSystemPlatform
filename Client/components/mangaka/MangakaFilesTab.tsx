import React, { useEffect, useState } from 'react';
import { Upload, FolderKanban } from 'lucide-react';
import { fileApi } from '@/services/file-api';
import { FileAssetResponse } from '@/types/file';

interface MangakaFilesTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaFilesTab({ triggerModal }: MangakaFilesTabProps) {
  const [files, setFiles] = useState<FileAssetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fileApi.getMyFiles();
      if (res.data?.success) {
        setFiles(res.data.data || []);
      } else {
        setFiles([]);
      }
    } catch {
      setError('File service is not available in this environment yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const res = await fileApi.uploadFile(file, 'Submission', { source: 'mangaka-ui' });
      if (res.data?.success) {
        triggerModal('Upload Complete', `File ${file.name} was uploaded successfully.`);
        void loadFiles();
      } else {
        triggerModal('Upload Failed', res.data?.message || 'The file could not be uploaded.');
      }
    } catch (err: any) {
      triggerModal('Upload Failed', err.response?.data?.message || 'The file could not be uploaded.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Studio Asset Manager</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Storage vault for comic pages, character concept design sketches, vector panels, PSD files, and exports.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-plum-700 hover:bg-plum-800 active:bg-plum-900 transition-colors shadow-sm">
          <Upload size={14} />
          <span>Upload Assets</span>
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-150 bg-white p-6 text-sm text-slate-500">Loading assets…</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      ) : files.length === 0 ? (
        <div className="rounded-xl border border-slate-150 bg-white p-6 text-sm text-slate-500">No assets available yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {files.map((file) => (
            <div key={file.id} className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs hover:border-burgundy-200 transition-colors flex flex-col justify-between">
              <div className="h-10 w-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shrink-0">
                <FolderKanban size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-750 truncate" title={file.originalFileName}>
                  {file.originalFileName}
                </h4>
                <p className="text-[10px] text-slate-455 font-semibold mt-0.5">
                  {file.category} • {Math.round(file.sizeBytes / 1024)} KB
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => triggerModal(`Open File: ${file.originalFileName}`, 'The uploaded asset can be opened or downloaded from the file service once the environment exposes a valid file ID.')}
                  className="text-burgundy-855 hover:text-burgundy-950 font-extrabold"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
