import { describe, expect, it, vi } from 'vitest';
const { get, post, del } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), del: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get, post, delete: del, patch: vi.fn() } }));
import { mangaApi } from '@/services/manga-api';
describe('P1 annotation contracts',()=>{it('loads, creates and deletes only persisted annotation IDs',async()=>{const page='33333333-3333-4333-8333-333333333333';const annotation='44444444-4444-4444-8444-444444444444';await mangaApi.getPageAnnotations(page);await mangaApi.createAnnotation(page,{type:'Other',coordinatesJson:JSON.stringify({x:10,y:20,width:30,height:40})});await mangaApi.deleteAnnotation(annotation);expect(get).toHaveBeenCalledWith(`/manga/pages/${page}/annotations`);expect(post).toHaveBeenCalledWith(`/manga/pages/${page}/annotations`,expect.objectContaining({coordinatesJson:expect.any(String)}));expect(del).toHaveBeenCalledWith(`/manga/annotations/${annotation}`)})});
