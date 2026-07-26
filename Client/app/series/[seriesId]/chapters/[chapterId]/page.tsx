'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mangaApi } from '@/services/manga-api';
import { fileApi } from '@/services/file-api';
import { AnnotationResponse, PageResponse } from '@/types/manga';

const message = (error: unknown): string => {
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 403
    ? 'Bạn không có quyền truy cập tài nguyên này.'
    : status === 404
    ? 'Không tìm thấy tài nguyên.'
    : error instanceof Error
    ? error.message
    : 'Yêu cầu thất bại.';
};
type Rect = { x: number; y: number; width: number; height: number };

export default function ChapterDetailPage() {
  const { seriesId, chapterId } = useParams<{ seriesId: string; chapterId: string }>();
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [selected, setSelected] = useState<PageResponse | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationResponse[]>([]);
  const [url, setUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [annotationLoading, setAnnotationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await mangaApi.getPages(chapterId);
      if (!r.data.success) throw new Error(r.data.message);
      setPages(r.data.data);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [chapterId]);

  const select = async (page: PageResponse) => {
    setSelected(page);
    setAnnotations([]);
    setUrl(null);
    setAnnotationLoading(true);
    setError(null);
    try {
      const [a, u] = await Promise.all([
        mangaApi.getPageAnnotations(page.id),
        page.fileId ? fileApi.getFileUrl(page.fileId) : Promise.resolve(null),
      ]);
      if (!a.data.success) throw new Error(a.data.message);
      setAnnotations(a.data.data);
      const fileUrlData = u?.data?.data;
      if (u?.data?.success && fileUrlData) setUrl(fileUrlData.url);
    } catch (e) {
      setError(message(e));
    } finally {
      setAnnotationLoading(false);
    }
  };

  const addPage = async () => {
    if (!file) return;
    setError(null);
    try {
      const u = await fileApi.uploadFile(file, 'PageScan');
      const fileData = u.data?.data;
      if (!u.data?.success || !fileData) throw new Error(u.data?.message || 'Upload failed');
      const r = await mangaApi.createPage(chapterId, {
        pageNumber: pages.length + 1,
        fileId: fileData.fileId,
      });
      if (!r.data.success) throw new Error(r.data.message);
      setFile(null);
      await load();
    } catch (e) {
      setError(message(e));
    }
  };

  return (
    <main className="space-y-4">
      <a href={`/series/${seriesId}`}>← Series</a>
      <h1>Chapter pages</h1>
      {error && (
        <div role="alert">
          {error}
          <button onClick={() => void load()}>Retry</button>
        </div>
      )}
      <input
        aria-label="Page file"
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button disabled={!file} onClick={() => void addPage()}>
        Upload and create page
      </button>
      {loading ? (
        <p>Loading pages…</p>
      ) : pages.length === 0 ? (
        <p>No pages yet.</p>
      ) : (
        <ul className="flex gap-2 flex-wrap">
          {pages.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => void select(p)}
                className={selected?.id === p.id ? 'font-bold underline' : ''}
              >
                Page {p.pageNumber}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <Editor
          page={selected}
          url={url}
          annotations={annotations}
          loading={annotationLoading}
          onChange={setAnnotations}
          onError={setError}
        />
      )}
    </main>
  );
}

function Editor({
  page,
  url,
  annotations,
  loading,
  onChange,
  onError,
}: {
  page: PageResponse;
  url: string | null;
  annotations: AnnotationResponse[];
  loading: boolean;
  onChange: (items: AnnotationResponse[]) => void;
  onError: (value: string | null) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const bounds = { width: 600, height: 800 };

  const point = (e: React.PointerEvent) => ({
    x: (e.nativeEvent.offsetX - pan.x) / zoom,
    y: (e.nativeEvent.offsetY - pan.y) / zoom,
  });

  const save = async () => {
    if (
      !rect ||
      rect.width < 4 ||
      rect.height < 4 ||
      rect.x < 0 ||
      rect.y < 0 ||
      rect.x + rect.width > bounds.width ||
      rect.y + rect.height > bounds.height
    ) {
      onError('Rectangle không hợp lệ.');
      return;
    }
    try {
      const r = await mangaApi.createAnnotation(page.id, {
        type: 'Other',
        coordinatesJson: JSON.stringify(rect),
      });
      if (!r.data.success) throw new Error(r.data.message);
      onChange([...annotations, r.data.data]);
      setRect(null);
    } catch (e) {
      onError(message(e));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete annotation?')) return;
    try {
      const r = await mangaApi.deleteAnnotation(id);
      if (!r.data.success) throw new Error(r.data.message);
      onChange(annotations.filter((a) => a.id !== id));
      if (chosen === id) setChosen(null);
    } catch (e) {
      onError(message(e));
    }
  };

  return (
    <section>
      <div className="flex gap-2">
        <button onClick={() => setZoom((v) => Math.min(3, v + 0.25))}>Zoom in</button>
        <button onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))}>Zoom out</button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          Reset
        </button>
      </div>
      {loading ? (
        <p>Loading annotations…</p>
      ) : (
        <div
          aria-label="Annotation canvas"
          onPointerDown={(e) => {
            const p = point(e);
            setDrag(p);
          }}
          onPointerMove={(e) => {
            if (drag) {
              const p = point(e);
              setRect({
                x: Math.min(drag.x, p.x),
                y: Math.min(drag.y, p.y),
                width: Math.abs(p.x - drag.x),
                height: Math.abs(p.y - drag.y),
              });
            }
          }}
          onPointerUp={() => setDrag(null)}
          style={{
            width: bounds.width,
            height: bounds.height,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid',
          }}
        >
          {url && (
            <img
              src={url}
              alt="Page"
              style={{
                transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                userSelect: 'none',
              }}
            />
          )}
          {annotations.map((a) => {
            const coords = JSON.parse(a.coordinatesJson || '{}') as Rect;
            return (
              <div
                key={a.id}
                onClick={() => setChosen(a.id === chosen ? null : a.id)}
                style={{
                  position: 'absolute',
                  left: coords.x * zoom + pan.x,
                  top: coords.y * zoom + pan.y,
                  width: coords.width * zoom,
                  height: coords.height * zoom,
                  border: `2px solid ${a.id === chosen ? 'red' : 'blue'}`,
                  cursor: 'pointer',
                }}
              >
                {a.id === chosen && (
                  <button
                    style={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={() => void remove(a.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          {rect && (
            <div
              style={{
                position: 'absolute',
                left: rect.x * zoom + pan.x,
                top: rect.y * zoom + pan.y,
                width: rect.width * zoom,
                height: rect.height * zoom,
                border: '2px dashed green',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      )}
      {rect && rect.width >= 4 && rect.height >= 4 && (
        <button onClick={() => void save()}>Save annotation</button>
      )}
    </section>
  );
}
