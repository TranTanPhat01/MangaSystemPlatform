'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mangaApi } from '@/services/manga-api';
import { editorialApi } from '@/services/editorial-api';
import { ChapterResponse, SeriesResponse } from '@/types/manga';
import { PublicationScheduleResponse, BoardVoteSummaryResponse } from '@/types/editorial';

type State = 'loading' | 'forbidden' | 'notfound' | 'error' | 'ready';

const typeLabel = {
  1: 'Weekly',
  2: 'Monthly',
  3: 'One-shot',
  4: 'Special issue',
} as const;

const statusLabel = {
  1: 'Scheduled',
  2: 'Published',
  3: 'Hiatus',
  4: 'Cancelled',
} as const;

export default function SeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const router = useRouter();
  const [series, setSeries] = useState<SeriesResponse | null>(null);
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [schedules, setSchedules] = useState<PublicationScheduleResponse[]>([]);
  const [voteSummary, setVoteSummary] = useState<BoardVoteSummaryResponse | null>(null);
  const [state, setState] = useState<State>('loading');
  const [title, setTitle] = useState('');

  const load = async () => {
    setState('loading');
    try {
      const [s, c, schedRes] = await Promise.all([
        mangaApi.getSeriesById(seriesId),
        mangaApi.getChapters(seriesId),
        editorialApi.getPublicationSchedules().catch(() => ({ data: { success: true, data: [] } })),
      ]);
      
      if (!s.data.success || !c.data.success) throw new Error(s.data.message || c.data.message);
      
      setSeries(s.data.data);
      setChapters(c.data.data);
      
      const seriesSchedules = (schedRes.data?.data || []).filter(item => item.seriesId === seriesId);
      setSchedules(seriesSchedules);

      try {
        const summaryRes = await editorialApi.getVoteSummary(seriesId);
        if (summaryRes.data.success) {
          setVoteSummary(summaryRes.data.data);
        }
      } catch (err) {
        // user might not have board roles to view vote details, fallback silently
      }

      setState('ready');
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      setState(status === 403 ? 'forbidden' : status === 404 ? 'notfound' : 'error');
    }
  };

  useEffect(() => {
    void load();
  }, [seriesId]);

  const create = async () => {
    if (!title.trim()) return;
    try {
      const r = await mangaApi.createChapter(seriesId, {
        chapterNumber: chapters.length + 1,
        title: title.trim(),
      });
      if (!r.data.success) throw new Error();
      setTitle('');
      await load();
    } catch {
      setState('error');
    }
  };

  if (state === 'loading') return <p>Loading series…</p>;

  if (state === 'forbidden') {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold text-rose-600">Forbidden</h1>
        <p className="text-sm mt-2">You do not have access to this series.</p>
      </main>
    );
  }

  if (state === 'notfound') {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold text-slate-700">Not Found</h1>
        <p className="text-sm mt-2">Series does not exist.</p>
      </main>
    );
  }

  if (state === 'error') {
    return (
      <main className="p-6">
        <p role="alert" className="text-sm text-rose-600">Unable to load series.</p>
        <button onClick={() => void load()} className="mt-2 px-3 py-1.5 bg-slate-800 text-white rounded">Retry</button>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => router.push('/series')} className="px-3 py-1.5 bg-white border rounded text-xs font-semibold">Back</button>
        <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-full border font-bold text-slate-700">Status: {series?.status}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">{series?.title}</h1>
        {series?.description && <p className="text-sm text-slate-600 mt-1">{series.description}</p>}
      </div>

      {voteSummary && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
          <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Editorial Board Decision Details</h2>
          <p className="text-xs text-slate-600">Final Recommendation: <span className="font-bold text-indigo-600">{voteSummary.finalRecommendation}</span></p>
          <p className="text-[11px] text-slate-500">Votes: {voteSummary.approve} Approve · {voteSummary.reject} Reject · {voteSummary.revision} Revision · {voteSummary.abstain} Abstain</p>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Publication Lịch Trình</h2>
        {schedules.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium">Chưa có lịch xuất bản cho series này.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {schedules.map((item) => (
              <div key={item.id} className="bg-white border rounded-xl p-3 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{typeLabel[item.publicationType as keyof typeof typeLabel]}</span>
                  <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border">{statusLabel[item.status as keyof typeof statusLabel]}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700">Chapter ID: {item.chapterId}</p>
                <p className="text-[11px] text-slate-500">Scheduled: {new Date(item.scheduledDate).toLocaleString()}</p>
                {item.publishedAt && <p className="text-[11px] text-emerald-600">Published: {new Date(item.publishedAt).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Chapters</h2>
        <div className="flex gap-2">
          <input
            aria-label="Chapter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên chapter mới..."
            className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <button onClick={() => void create()} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors">Create chapter</button>
        </div>

        {chapters.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium">No chapters.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {chapters.map((c) => (
              <button 
                key={c.id} 
                onClick={() => router.push(`/series/${seriesId}/chapters/${c.id}`)}
                className="flex justify-between items-center p-3 bg-white border hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors text-left"
              >
                <span>Chapter {c.chapterNumber}: {c.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100">{c.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
