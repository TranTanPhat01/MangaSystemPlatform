import { useEffect, useState } from 'react';
import { fileApi } from '@/services/file-api';
import { mangaApi } from '@/services/manga-api';
import { TaskPriority, TaskResponse, TaskStatus, TaskSubmissionResponse } from '@/types/manga';

export interface TaskItemUI {
  id: string;
  title: string;
  series: string;
  chapter: string;
  annotationType: string;
  priority: TaskPriority;
  deadline: string;
  deadlineOverdue?: boolean;
  status: TaskStatus;
  action: 'Continue' | 'View' | 'Fix Now' | 'Review' | 'Start';
  color: string;
  pageFileAssetId?: string;
  submittedFileAssetId?: string;
  notes?: string;
  latestSubmission?: TaskSubmissionResponse | null;
  submissionHistory: TaskSubmissionResponse[];
  isMock: false;
}

type ApiError = { message?: unknown; response?: { status?: number; data?: { message?: unknown; error?: unknown } } };
const compactId = (id: string) => id.slice(0, 8);

function toErrorMessage(error: unknown, action: string) {
  const apiError = error as ApiError;
  const value = apiError.response?.data?.message ?? apiError.response?.data?.error ?? apiError.message;
  if (typeof value === 'string' && value.trim()) return value;
  if (apiError.response?.status === 403) return 'You do not have permission to perform this task action.';
  if (apiError.response?.status === 404) return 'The task or referenced file was not found.';
  return `Unable to ${action} task.`;
}

function toTaskItem(task: TaskResponse): TaskItemUI {
  const action = task.status === TaskStatus.Todo ? 'Start'
    : task.status === TaskStatus.InProgress ? 'Continue'
      : task.status === TaskStatus.RevisionRequired ? 'Fix Now'
        : task.status === TaskStatus.Submitted ? 'View' : 'Review';
  return {
    id: task.id,
    title: task.title,
    series: `Assignee ${compactId(task.assignedToUserId)}`,
    chapter: `Page ${task.pageNumber}`,
    annotationType: `Annotation ${compactId(task.annotationId)}`,
    priority: task.priority,
    deadline: task.deadline ? new Date(task.deadline).toLocaleDateString() : '—',
    deadlineOverdue: Boolean(task.deadline && new Date(task.deadline) < new Date() && task.status !== TaskStatus.Approved),
    status: task.status,
    action,
    color: 'bg-indigo-500',
    pageFileAssetId: task.pageFileId ?? undefined,
    submittedFileAssetId: task.latestSubmission?.fileId ?? undefined,
    notes: task.latestSubmission?.note ?? undefined,
    latestSubmission: task.latestSubmission,
    submissionHistory: task.submissionHistory ?? (task.latestSubmission ? [task.latestSubmission] : []),
    isMock: false,
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItemUI[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItemUI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true); setError(null);
    try {
      const response = await mangaApi.getMyTasks();
      if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch tasks.');
      const mapped = response.data.data.map(toTaskItem);
      setTasks(mapped);
      setSelectedTask((current) => mapped.find((task) => task.id === current?.id) ?? mapped[0] ?? null);
    } catch (error: unknown) {
      setTasks([]); setSelectedTask(null); setError(toErrorMessage(error, 'load'));
    } finally { setIsLoading(false); }
  };

  const startTask = async (id: string) => {
    setIsStarting(true); setError(null); setSuccessMessage(null);
    try {
      const response = await mangaApi.startTask(id);
      if (!response.data.success) throw new Error(response.data.message || 'Unable to start task.');
      await fetchTasks(); setSuccessMessage('Task started.');
    } catch (error: unknown) { setError(toErrorMessage(error, 'start')); }
    finally { setIsStarting(false); }
  };

  const submitTask = async (id: string, file: File, note?: string) => {
    setIsSubmitting(true); setError(null); setSuccessMessage(null);
    try {
      const upload = await fileApi.uploadFile(file, 'Submission');
      const fileData = upload.data?.data;
      if (!upload.data?.success || !fileData) throw new Error(upload.data?.message || 'Unable to upload submission file.');
      const trimmedNote = note?.trim();
      const response = await mangaApi.submitTask(
        id,
        trimmedNote ? { fileId: fileData.fileId || fileData.id, note: trimmedNote } : { fileId: fileData.fileId || fileData.id }
      );
      if (!response.data.success) throw new Error(response.data.message || 'Unable to submit task.');
      await fetchTasks(); setSuccessMessage('Task submission sent.');
    } catch (error: unknown) { setError(toErrorMessage(error, 'submit')); }
    finally { setIsSubmitting(false); }
  };

  const downloadPageAsset = async (fileId: string, fileName: string) => {
    setError(null);
    try {
      const response = await fileApi.downloadFile(fileId);
      if (!(response.data instanceof Blob)) throw new Error('The downloaded file is invalid.');
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = fileName; link.click(); window.URL.revokeObjectURL(url);
    } catch (error: unknown) { setError(toErrorMessage(error, 'download task reference')); }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchTasks(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { tasks, selectedTask, isLoading, isStarting, isSubmitting, error, successMessage, fetchTasks, selectTask: setSelectedTask, startTask, submitTask, downloadPageAsset, clearError: () => setError(null), clearSuccess: () => setSuccessMessage(null) };
}
