import React, { useEffect, useState } from 'react';
import { mangaApi } from '@/services/manga-api';
import { ChapterResponse, SeriesResponse } from '@/types/manga';
import {
  CreatePublicationScheduleRequest,
  IssueResponse,
  PublicationScheduleResponse,
  PublicationType,
} from '@/types/editorial';

interface Props {
  schedules: PublicationScheduleResponse[];
  issues: IssueResponse[];
  onCreate: (data: CreatePublicationScheduleRequest) => Promise<boolean>;
  onPublish: (scheduleId: string) => Promise<boolean>;
  publishingScheduleId: string | null;
  isSubmitting: boolean;
}

const typeLabel: Record<PublicationType, string> = {
  [PublicationType.Weekly]: 'Weekly',
  [PublicationType.Monthly]: 'Monthly',
  [PublicationType.OneShot]: 'One-shot',
  [PublicationType.SpecialIssue]: 'Special issue',
};

const statusLabel = {
  1: 'Scheduled',
  2: 'Published',
  3: 'Hiatus',
  4: 'Cancelled',
} as const;

export default function BoardBottomRow({
  schedules,
  issues,
  onCreate,
  onPublish,
  publishingScheduleId,
  isSubmitting,
}: Props) {
  const [series, setSeries] = useState<SeriesResponse[]>([]);
  const [seriesId, setSeriesId] = useState('');
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [issueId, setIssueId] = useState('');
  const [publicationType, setPublicationType] = useState(PublicationType.Weekly);
  const [scheduledDate, setScheduledDate] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void mangaApi
      .getSeries()
      .then((r) =>
        setSeries(r.data.success ? r.data.data : [])
      )
      .catch(() => setLoadError('Không thể tải Series.'));
  }, []);

  useEffect(() => {
    if (!seriesId) return;
    void mangaApi
      .getChapters(seriesId)
      .then((r) =>
        setChapters(r.data.success ? r.data.data : [])
      )
      .catch(() => setLoadError('Không thể tải Chapter.'));
  }, [seriesId]);

  useEffect(() => {
    if (!seriesId) {
      setChapterId('');
      setChapters([]);
    }
  }, [seriesId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!seriesId || !chapterId || !scheduledDate) return;

    const saved = await onCreate({
      seriesId,
      chapterId,
      ...(issueId ? { issueId } : {}),
      publicationType,
      scheduledDate: new Date(scheduledDate).toISOString(),
    });

    if (saved) {
      setChapterId('');
      setIssueId('');
      setScheduledDate('');
    }
  };

  const handlePublish = async (scheduleId: string) => {
    if (window.confirm("Are you sure you want to publish this schedule? This action will make it live immediately.")) {
      await onPublish(scheduleId);
    }
  };

  const getSeriesTitle = (id: string) => series.find((s) => s.id === id)?.title || id;
  const approvedSeries = series.filter((s) => s.status === 3 || (s.status as string | number) === 'Approved');

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Create Publication Schedule Form */}
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border p-5 space-y-3"
      >
        <h3 className="font-bold">Tạo lịch xuất bản</h3>

        {loadError && <p className="text-sm text-rose-600">{loadError}</p>}

        <select
          aria-label="Series"
          required
          value={seriesId}
          onChange={(e) => setSeriesId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Chọn Series</option>
          {approvedSeries.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>

        <select
          aria-label="Chapter"
          required
          disabled={!seriesId}
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Chọn Chapter</option>
          {chapters.map((item) => (
            <option key={item.id} value={item.id}>
              Chapter {item.chapterNumber}
              {item.title ? ` — ${item.title}` : ''}
            </option>
          ))}
        </select>

        <select
          aria-label="Issue optional"
          value={issueId}
          onChange={(e) => setIssueId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Không gắn Issue</option>
          {issues.map((item) => (
            <option key={item.id} value={item.id}>
              {item.issueNumber} — {item.title}
            </option>
          ))}
        </select>

        <select
          aria-label="Publication type"
          value={publicationType}
          onChange={(e) =>
            setPublicationType(Number(e.target.value) as PublicationType)
          }
          className="w-full border p-2 rounded"
        >
          {Object.values(PublicationType)
            .filter((value) => typeof value === 'number')
            .map((value) => (
              <option key={value} value={value}>
                {typeLabel[value as PublicationType]}
              </option>
            ))}
        </select>

        <input
          aria-label="Scheduled date"
          required
          type="datetime-local"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button
          disabled={isSubmitting || !chapterId}
          className="px-4 py-2 bg-slate-800 text-white rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Đang tạo…' : 'Tạo lịch'}
        </button>
      </form>

      {/* Publication Schedule List */}
      <section className="bg-white rounded-2xl border p-5">
        <h3 className="font-bold mb-3">Lịch xuất bản</h3>

        {schedules.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có lịch xuất bản.</p>
        ) : (
          <ul className="space-y-3">
            {schedules.map((item) => (
              <li key={item.id} className="border-b pb-2 text-sm">
                <p>Series: {getSeriesTitle(item.seriesId)}</p>
                <p>
                  Chapter: {item.chapterId} · {typeLabel[item.publicationType]}
                </p>
                <p>Status: {statusLabel[item.status]}</p>
                <p>{new Date(item.scheduledDate).toLocaleString()}</p>
                {item.publishedAt && (
                  <p>
                    Published:{' '}
                    {new Date(item.publishedAt).toLocaleString()}
                  </p>
                )}
                {item.status === 1 && (
                  <button
                    type="button"
                    disabled={publishingScheduleId === item.id}
                    onClick={() => void handlePublish(item.id)}
                    className="mt-2 px-3 py-1 bg-emerald-700 text-white rounded disabled:opacity-50"
                  >
                    {publishingScheduleId === item.id
                      ? 'Đang xuất bản…'
                      : 'Publish'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
