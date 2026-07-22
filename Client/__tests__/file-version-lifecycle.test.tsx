import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import FileListTable from '@/components/files/FileListTable';
import { fileApi } from '@/services/file-api';
import { FileAssetResponse, FileVersionResponse } from '@/types/file';
import { ApiResponse } from '@/types/api';
import type { AxiosResponse } from 'axios';

vi.mock('@/services/file-api', () => ({
  fileApi: { getFileVersions: vi.fn(), createVersion: vi.fn() },
}));

const asset: FileAssetResponse = {
  id: 'file-1', originalFileName: 'page.png', storedFileName: 'page.png', contentType: 'image/png',
  extension: '.png', sizeInBytes: 120, storageProvider: 'Local', storagePath: 'files/page.png',
  publicUrl: undefined, uploadedByUserId: 'user-1', fileCategory: 'PageScan', status: 'Active', createdAt: '2026-07-22T00:00:00Z',
};
const version: FileVersionResponse = {
  id: 'version-2', fileAssetId: 'file-1', versionNumber: 2, storedFileName: 'page-v2.png',
  storagePath: 'files/page-v2.png', sizeInBytes: 140, createdAt: '2026-07-22T01:00:00Z', createdByUserId: 'user-1',
};
const response = <T,>(data: T): AxiosResponse<ApiResponse<T>> => ({
  data: { success: true, data, timestamp: '2026-07-22T00:00:00Z' },
} as unknown as AxiosResponse<ApiResponse<T>>);

describe('file version lifecycle UI', () => {
  const onDownload = vi.fn().mockResolvedValue(undefined);
  const onPreview = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);
  const onRefresh = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads version history from the selected real file id without inventing version download routes', async () => {
    vi.mocked(fileApi.getFileVersions).mockResolvedValue(response([version]));
    render(<FileListTable files={[asset]} isLoading={false} onDownload={onDownload} onPreview={onPreview} onDelete={onDelete} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'View versions for page.png' }));
    expect(fileApi.getFileVersions).toHaveBeenCalledWith('file-1');
    expect(await screen.findByText(/Version 2/)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Download version 2' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Preview version 2' })).toBeNull();
  });

  it('uploads a real file only to the selected asset then refreshes versions and file list', async () => {
    vi.mocked(fileApi.getFileVersions).mockResolvedValue(response([version]));
    vi.mocked(fileApi.createVersion).mockResolvedValue(response(version));
    render(<FileListTable files={[asset]} isLoading={false} onDownload={onDownload} onPreview={onPreview} onDelete={onDelete} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'View versions for page.png' }));
    await screen.findByText(/Version 2/);
    const input = screen.getByLabelText('Upload new version');
    const newFile = new File(['new content'], 'page-v3.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [newFile] } });
    await waitFor(() => expect(fileApi.createVersion).toHaveBeenCalledWith('file-1', newFile));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(fileApi.getFileVersions).toHaveBeenCalledTimes(2);
  });

  it('keeps the version form open and renders no invented version after an upload failure', async () => {
    vi.mocked(fileApi.getFileVersions).mockResolvedValue(response([]));
    vi.mocked(fileApi.createVersion).mockRejectedValue({ response: { status: 403, data: { message: 'Denied' } } });
    render(<FileListTable files={[asset]} isLoading={false} onDownload={onDownload} onPreview={onPreview} onDelete={onDelete} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'View versions for page.png' }));
    await screen.findByText('No version history found.');
    fireEvent.change(screen.getByLabelText('Upload new version'), { target: { files: [new File(['x'], 'denied.png')] } });
    expect((await screen.findByRole('alert')).textContent).toContain('Forbidden');
    expect(screen.getByLabelText('Upload new version')).not.toBeNull();
    expect(screen.queryByText('Version 1')).toBeNull();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('uses empty and error states without importing production mock data', async () => {
    vi.mocked(fileApi.getFileVersions).mockRejectedValue(new Error('Network unavailable'));
    render(<FileListTable files={[asset]} isLoading={false} onDownload={onDownload} onPreview={onPreview} onDelete={onDelete} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'View versions for page.png' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(fileApi.getFileVersions).toHaveBeenCalledTimes(2));
    const productionSource = readFileSync('components/files/FileListTable.tsx', 'utf8');
    expect(productionSource).not.toContain('data/mock');
  });
});
