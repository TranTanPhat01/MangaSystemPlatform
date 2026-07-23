import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mangaApi = vi.hoisted(() => ({ getSeries: vi.fn(), getChapters: vi.fn(), getPages: vi.fn(), getPageAnnotations: vi.fn(), getMyTasks: vi.fn(), createTask: vi.fn(), approveTask: vi.fn(), requestTaskRevision: vi.fn() }));
const authApi = vi.hoisted(() => ({ getAssistants: vi.fn() }));
vi.mock('@/services/manga-api', () => ({ mangaApi }));
vi.mock('@/services/auth-api', () => ({ authApi }));
import MangakaTasksTab from '@/components/mangaka/MangakaTasksTab';

const ids = { series: '11111111-1111-4111-8111-111111111111', chapter: '22222222-2222-4222-8222-222222222222', page: '33333333-3333-4333-8333-333333333333', annotation: '44444444-4444-4444-8444-444444444444', assistant: '55555555-5555-4555-8555-555555555555' };
describe('task workflow UI', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mangaApi.getSeries.mockResolvedValue({ data: { success: true, data: [{ id: ids.series, title: 'Series' }] } }); authApi.getAssistants.mockResolvedValue({ data: { success: true, data: [{ id: ids.assistant, fullName: 'Assistant', email: 'a@example.com' }] } }); mangaApi.getMyTasks.mockResolvedValue({ data: { success: true, data: [] } }); mangaApi.getChapters.mockResolvedValue({ data: { success: true, data: [{ id: ids.chapter, chapterNumber: 1, title: 'One' }] } }); mangaApi.getPages.mockResolvedValue({ data: { success: true, data: [{ id: ids.page, pageNumber: 1 }] } }); mangaApi.getPageAnnotations.mockResolvedValue({ data: { success: true, data: [{ id: ids.annotation, type: 'Background' }] } }); mangaApi.createTask.mockResolvedValue({ data: { success: true, data: {} } });
  });
  it('blocks creation until page, annotation, assistant and title are selected', async () => {
    render(<MangakaTasksTab triggerModal={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Assign New Task' }));
    await waitFor(() => expect((screen.getByLabelText('Series') as HTMLSelectElement).disabled).toBe(false));
    const create = screen.getByRole('button', { name: 'Create & Assign Task' }) as HTMLButtonElement; expect(create.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Series'), { target: { value: ids.series } }); await waitFor(() => expect((screen.getByLabelText('Chapter') as HTMLSelectElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('Chapter'), { target: { value: ids.chapter } }); await waitFor(() => expect((screen.getByLabelText('Page') as HTMLSelectElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('Page'), { target: { value: ids.page } }); await waitFor(() => expect((screen.getByLabelText('Annotation') as HTMLSelectElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('Annotation'), { target: { value: ids.annotation } }); fireEvent.change(screen.getByLabelText('Assistant'), { target: { value: ids.assistant } }); fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'Shade panel' } });
    await waitFor(() => expect(create.disabled).toBe(false));
    fireEvent.click(create); await waitFor(() => expect(mangaApi.createTask).toHaveBeenCalledWith(expect.objectContaining({ assignedToUserId: ids.assistant })));
  });
});
