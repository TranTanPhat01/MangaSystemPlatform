import { describe, expect, it, vi } from 'vitest';
const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get, post, patch: vi.fn(), delete: vi.fn() } }));
import { mangaApi } from '@/services/manga-api';
import { fileApi } from '@/services/file-api';
describe('P1 series chapter page contracts', () => {
 it('uses real route IDs for series and chapter resources', async()=>{await mangaApi.getSeriesById('11111111-1111-4111-8111-111111111111');await mangaApi.getChapters('11111111-1111-4111-8111-111111111111');await mangaApi.getPages('22222222-2222-4222-8222-222222222222');expect(get).toHaveBeenCalledWith('/manga/series/11111111-1111-4111-8111-111111111111');expect(get).toHaveBeenCalledWith('/manga/chapters/22222222-2222-4222-8222-222222222222/pages')});
 it('creates a page only with a real file id and resolves its file URL',async()=>{await mangaApi.createPage('22222222-2222-4222-8222-222222222222',{pageNumber:1,fileId:'33333333-3333-4333-8333-333333333333'});await fileApi.getFileUrl('33333333-3333-4333-8333-333333333333');expect(post).toHaveBeenCalledWith('/manga/chapters/22222222-2222-4222-8222-222222222222/pages',{pageNumber:1,fileId:'33333333-3333-4333-8333-333333333333'});expect(get).toHaveBeenCalledWith('/files/33333333-3333-4333-8333-333333333333/url')});
});
