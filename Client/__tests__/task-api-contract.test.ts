import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get: mockGet, post: mockPost } }));

import { mangaApi } from '@/services/manga-api';
import { TaskPriority } from '@/types/manga';

const ids = { task: '11111111-1111-4111-8111-111111111111', page: '22222222-2222-4222-8222-222222222222', annotation: '33333333-3333-4333-8333-333333333333', assistant: '44444444-4444-4444-8444-444444444444', file: '55555555-5555-4555-8555-555555555555' };

describe('task API contract', () => {
  beforeEach(() => { vi.clearAllMocks(); mockPost.mockResolvedValue({ data: { success: true, data: {} } }); });
  it('creates a task with the backend request DTO only', async () => {
    await mangaApi.createTask({ annotationId: ids.annotation, pageId: ids.page, assignedToUserId: ids.assistant, title: 'Shade panel', description: 'Use soft shading.', priority: TaskPriority.High, deadline: '2026-08-01T00:00:00Z' });
    expect(mockPost).toHaveBeenCalledWith('/manga/tasks', { annotationId: ids.annotation, pageId: ids.page, assignedToUserId: ids.assistant, title: 'Shade panel', description: 'Use soft shading.', priority: 3, deadline: '2026-08-01T00:00:00Z' });
    expect(mockPost.mock.calls[0][1]).not.toHaveProperty('assignedToId');
  });
  it('rejects zero GUID task workflow IDs before a request is sent', async () => {
    expect(() => mangaApi.createTask({ annotationId: '00000000-0000-0000-0000-000000000000', pageId: ids.page, assignedToUserId: ids.assistant, title: 'Invalid', priority: TaskPriority.Medium })).toThrow('annotationId');
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('uses no body for start and approve, and the backend submission DTO for submit', async () => {
    await mangaApi.startTask(ids.task); await mangaApi.submitTask(ids.task, { fileId: ids.file, note: 'Done.' }); await mangaApi.approveTask(ids.task);
    expect(mockPost).toHaveBeenNthCalledWith(1, `/manga/tasks/${ids.task}/start`);
    expect(mockPost).toHaveBeenNthCalledWith(2, `/manga/tasks/${ids.task}/submit`, { fileId: ids.file, note: 'Done.' });
    expect(mockPost).toHaveBeenNthCalledWith(3, `/manga/tasks/${ids.task}/approve`);
  });
  it('sends reason, never revisionNote, for a revision request', async () => {
    await mangaApi.requestTaskRevision(ids.task, { reason: 'Correct the background shading.' });
    expect(mockPost).toHaveBeenCalledWith(`/manga/tasks/${ids.task}/request-revision`, { reason: 'Correct the background shading.' });
    expect(mockPost.mock.calls[0][1]).not.toHaveProperty('revisionNote');
  });
  it.each([400, 401, 403, 404])('propagates HTTP %i task errors', async (status) => {
    const error = { response: { status, data: { message: `HTTP ${status}` } } }; mockPost.mockRejectedValue(error);
    await expect(mangaApi.approveTask(ids.task)).rejects.toBe(error);
  });
});
