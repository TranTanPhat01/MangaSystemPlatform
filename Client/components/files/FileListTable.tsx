'use client';

import { ChangeEvent, useCallback, useState } from 'react';
import { Download, Eye, History, Trash2 } from 'lucide-react';
import { fileApi } from '@/services/file-api';
import { FileAssetResponse, FileVersionResponse } from '@/types/file';

interface FileListTableProps {
  files: FileAssetResponse[];
  onDownload: (id: string, name: string) => Promise<void>;
  onPreview: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

interface ApiFailure {
  response?: { status?: number; data?: { message?: string } };
  message?: string;
}

function errorMessage(error: unknown): string {
  const failure = error as ApiFailure;
  if (failure.response?.status === 403) return 'Forbidden: you do not have permission to view file versions.';
  return failure.response?.data?.message ?? failure.message ?? 'Unable to load file versions.';
}

export default function FileListTable({ files, onDownload, onPreview, onDelete, onRefresh, isLoading }: FileListTableProps) {
  const [selectedFile, setSelectedFile] = useState<FileAssetResponse | null>(null);
  const [versions, setVersions] = useState<FileVersionResponse[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const loadVersions = useCallback(async (file: FileAssetResponse) => {
    setSelectedFile(file);
    setIsLoadingVersions(true);
    setVersionError(null);
    try {
      const response = await fileApi.getFileVersions(file.id);
      if (!response.data.success) throw new Error(response.data.message);
      setVersions([...response.data.data].sort((left, right) => right.versionNumber - left.versionNumber));
    } catch (error) {
      setVersions([]);
      setVersionError(errorMessage(error));
    } finally {
      setIsLoadingVersions(false);
    }
  }, []);

  const uploadVersion = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedFile || isUploadingVersion) return;

    setIsUploadingVersion(true);
    setVersionError(null);
    try {
      const response = await fileApi.createVersion(selectedFile.id, file);
      if (!response.data.success) throw new Error(response.data.message);
      await Promise.all([loadVersions(selectedFile), onRefresh()]);
      event.target.value = '';
    } catch (error) {
      setVersionError(errorMessage(error));
    } finally {
      setIsUploadingVersion(false);
    }
  };

  return (
    <section aria-labelledby="workspace-files-heading">
      <h3 id="workspace-files-heading">Workspace Files</h3>
      {isLoading ? <p>Loading files…</p> : files.length === 0 ? <p>No files found.</p> : (
        <table>
          <thead><tr><th>Name</th><th>Size</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.originalFileName}</td><td>{file.sizeInBytes} bytes</td><td>{file.fileCategory}</td>
                <td>
                  <button aria-label={`Download ${file.originalFileName}`} onClick={() => void onDownload(file.id, file.originalFileName)}><Download size={14} /></button>
                  <button aria-label={`Preview ${file.originalFileName}`} onClick={() => void onPreview(file.id)}><Eye size={14} /></button>
                  <button aria-label={`View versions for ${file.originalFileName}`} onClick={() => void loadVersions(file)}><History size={14} /></button>
                  <button aria-label={`Delete ${file.originalFileName}`} onClick={() => void onDelete(file.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedFile && (
        <aside aria-label="File version history">
          <h4>Version history: {selectedFile.originalFileName}</h4>
          <p>{versions.length ? `${versions.length} versions reported by File Service.` : 'Current version information is supplied by File Service.'}</p>
          {versionError && <div role="alert">{versionError}<button onClick={() => void loadVersions(selectedFile)}>Retry</button></div>}
          <label>
            <span>Upload new version</span>
            <input aria-label="Upload new version" type="file" disabled={isUploadingVersion} onChange={(event) => void uploadVersion(event)} />
          </label>
          {isUploadingVersion && <p>Uploading version…</p>}
          {isLoadingVersions ? <p>Loading version history…</p> : !versionError && versions.length === 0 ? <p>No version history found.</p> : (
            <ul>
              {versions.map((version, index) => (
                <li key={version.id}>
                  <strong>{index === 0 ? 'Current ' : ''}Version {version.versionNumber}</strong>
                  <span> · {version.storedFileName} · {version.sizeInBytes} bytes · {new Date(version.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </section>
  );
}
