import { useEffect, useState } from 'react';
import { authApi, AssistantDirectoryItem } from '@/services/auth-api';
import { mangaApi } from '@/services/manga-api';
import {
  ChapterResponse,
  CreateTaskRequest,
  PageResponse,
  AnnotationResponse,
  SeriesResponse,
  TaskPriority,
  TaskResponse,
  TaskStatus,
} from '@/types/manga';
import { isValidNonEmptyGuid } from '@/lib/guid';

interface MangakaTasksTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaTasksTab({ triggerModal }: MangakaTasksTabProps) {
  // State for hierarchical data
  const [series, setSeries] = useState<SeriesResponse[]>([]);
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationResponse[]>([]);
  const [assistants, setAssistants] = useState<AssistantDirectoryItem[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);

  // State for selected values
  const [seriesId, setSeriesId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [pageId, setPageId] = useState('');
  const [annotationId, setAnnotationId] = useState('');
  const [assignedToUserId, setAssigned] = useState('');

  // State for form inputs
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh tasks from the API
   */
  const refresh = async () => {
    const r = await mangaApi.getMyTasks();
    if (!r.data.success) throw new Error(r.data.message);
    setTasks(r.data.data);
  };

  /**
   * Initial load: fetch series and assistants, then refresh tasks
   */
  useEffect(() => {
    void Promise.all([mangaApi.getSeries(), authApi.getAssistants()])
      .then(async ([s, a]) => {
        if (!s.data.success || !a.data.success) throw new Error('Load failed');
        setSeries(s.data.data);
        setAssistants(a.data.data);
        await refresh();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'));
  }, []);

  /**
   * Create a new task with the selected values
   */
  const create = async () => {
    if (
      !isValidNonEmptyGuid(pageId) ||
      !isValidNonEmptyGuid(annotationId) ||
      !isValidNonEmptyGuid(assignedToUserId) ||
      !title.trim()
    ) {
      return;
    }

    try {
      const r = await mangaApi.createTask({
        pageId,
        annotationId,
        assignedToUserId,
        title: title.trim(),
        priority: TaskPriority.Medium,
      } as CreateTaskRequest);

      if (!r.data.success) throw new Error(r.data.message);

      setTitle('');
      setAnnotationId('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    }
  };

  /**
   * Approve a task by ID
   */
  const approve = async (id: string) => {
    try {
      const r = await mangaApi.approveTask(id);
      if (!r.data.success) throw new Error(r.data.message);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    }
  };

  /**
   * Request a revision for a task
   */
  const revision = async (id: string) => {
    if (!reason.trim()) return;

    try {
      const r = await mangaApi.requestTaskRevision(id, {
        reason: reason.trim(),
      });

      if (!r.data.success) throw new Error(r.data.message);

      setReason('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revision failed');
    }
  };

  return (
    <main>
      {error && <p role="alert">{error}</p>}

      <h1>Task review</h1>

      {/* Series Selection */}
      <select
        aria-label="Series"
        value={seriesId}
        onChange={async (e) => {
          const id = e.target.value;
          setSeriesId(id);
          const r = await mangaApi.getChapters(id);
          if (r.data.success) setChapters(r.data.data);
        }}
      >
        <option value="">Series</option>
        {series.map((x) => (
          <option key={x.id} value={x.id}>
            {x.title}
          </option>
        ))}
      </select>

      {/* Chapter Selection */}
      <select
        aria-label="Chapter"
        value={chapterId}
        onChange={async (e) => {
          const id = e.target.value;
          setChapterId(id);
          const r = await mangaApi.getPages(id);
          if (r.data.success) setPages(r.data.data);
        }}
      >
        <option value="">Chapter</option>
        {chapters.map((x) => (
          <option key={x.id} value={x.id}>
            {x.title}
          </option>
        ))}
      </select>

      {/* Page Selection */}
      <select
        aria-label="Page"
        value={pageId}
        onChange={async (e) => {
          const id = e.target.value;
          setPageId(id);
          const r = await mangaApi.getPageAnnotations(id);
          if (r.data.success) setAnnotations(r.data.data);
        }}
      >
        <option value="">Page</option>
        {pages.map((x) => (
          <option key={x.id} value={x.id}>
            Page {x.pageNumber}
          </option>
        ))}
      </select>

      {/* Annotation Selection */}
      <select
        aria-label="Annotation"
        value={annotationId}
        onChange={(e) => setAnnotationId(e.target.value)}
      >
        <option value="">Annotation</option>
        {annotations.map((x) => (
          <option key={x.id} value={x.id}>
            {x.type}
          </option>
        ))}
      </select>

      {/* Assistant Selection */}
      <select
        aria-label="Assistant"
        value={assignedToUserId}
        onChange={(e) => setAssigned(e.target.value)}
      >
        <option value="">Assistant</option>
        {assistants.map((x) => (
          <option key={x.id} value={x.id}>
            {x.fullName}
          </option>
        ))}
      </select>

      {/* Task Title Input */}
      <input
        aria-label="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Create Task Button */}
      <button onClick={() => void create()}>Create Task</button>

      {/* Revision Reason Input */}
      <input
        aria-label="Revision reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {/* Tasks Display */}
      {tasks.map((task) => (
        <article key={task.id}>
          <h2>{task.title}</h2>

          {task.latestSubmission && (
            <div>
              <p>
                Latest: {task.latestSubmission.fileId} · {task.latestSubmission.note}
              </p>
              {task.submissionHistory?.map((s) => (
                <p key={s.id}>
                  {s.fileId} · {s.submittedAt} · {s.status}
                </p>
              ))}
            </div>
          )}

          {task.status === TaskStatus.Submitted && (
            <>
              <button onClick={() => void approve(task.id)}>Approve</button>
              <button onClick={() => void revision(task.id)}>
                Request revision
              </button>
            </>
          )}
        </article>
      ))}
    </main>
  );
}
