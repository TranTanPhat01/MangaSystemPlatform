import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { fileApi } from '@/services/file-api';
import { TaskResponse, TaskStatus as ApiTaskStatus, TaskPriority as ApiTaskPriority } from '@/types/manga';
import { Task, TaskStatus, TaskPriority, TaskAction } from '@/types/assistant';

export function useAssistantDashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [apiTasks, setApiTasks] = useState<TaskResponse[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const fetchMyTasks = async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const res = await mangaApi.getMyTasks();
      if (res.data.success) {
        setApiTasks(res.data.data);
      } else {
        setTasksError(res.data.message || 'Failed to load tasks.');
      }
    } catch (err: any) {
      setTasksError(err.response?.data?.message || err.response?.data?.error || 'Could not reach task service.');
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const mapApiStatus = (status: ApiTaskStatus): TaskStatus => {
    if (status === ApiTaskStatus.Todo) return 'Pending';
    if (status === ApiTaskStatus.InProgress) return 'In Progress';
    if (status === ApiTaskStatus.RevisionRequired) return 'Revision Required';
    return status === ApiTaskStatus.Submitted ? 'Submitted' : status === ApiTaskStatus.Approved ? 'Approved' : 'Pending';
  };

  const startTask = async (taskId: string) => {
    setTasksError(null);
    setSubmissionMessage(null);
    try {
      const res = await mangaApi.startTask(taskId);
      if (res.data?.success) {
        await fetchMyTasks();
        return true;
      }
      setTasksError(res.data?.message || 'Unable to start the task.');
      return false;
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Could not start task.';
      setTasksError(message);
      return false;
    }
  };

  const submitTask = async (taskId: string, file: File, note?: string) => {
    setIsSubmitting(true);
    setTasksError(null);
    setSubmissionMessage(null);
    try {
      const currentTask = apiTasks.find((task) => task.id === taskId);
      if (currentTask && (currentTask.status === ApiTaskStatus.Todo || currentTask.status === ApiTaskStatus.RevisionRequired)) {
        await mangaApi.startTask(taskId);
      }

      const uploadRes = await fileApi.uploadFile(file, 'Submission', { source: 'assistant-ui' });
      const fileData = uploadRes.data?.data;
      if (!uploadRes.data?.success || !fileData) {
        throw new Error(uploadRes.data?.message || 'The upload could not be completed.');
      }

      const submitRes = await mangaApi.submitTask(taskId, {
        fileId: fileData.fileId || fileData.id || '',
        ...(note?.trim() ? { note: note.trim() } : {}),
      });

      if (submitRes.data?.success) {
        await fetchMyTasks();
        setSubmissionMessage('Submission uploaded successfully.');
        return true;
      }

      setTasksError(submitRes.data?.message || 'The submission could not be sent.');
      return false;
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Submission failed.';
      setTasksError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapApiPriority = (priority: ApiTaskPriority): TaskPriority => ApiTaskPriority[priority] as TaskPriority;

  const useMockFallback = false;
  const displayTasks: Task[] = apiTasks.length > 0
    ? apiTasks.map((t) => ({
        id: t.id,
        title: t.title,
        series: `Assignee ${t.assignedToUserId.slice(0, 8)}`,
        chapter: `Page ${t.pageNumber}`,
        annotationType: `Annotation ${t.annotationId.slice(0, 8)}`,
        priority: mapApiPriority(t.priority),
        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : '—',
        deadlineOverdue: t.deadline ? new Date(t.deadline) < new Date() && t.status !== ApiTaskStatus.Approved : false,
        status: mapApiStatus(t.status),
        action: (t.status === ApiTaskStatus.InProgress ? 'Continue' : t.status === ApiTaskStatus.RevisionRequired ? 'Fix Now' : t.status === ApiTaskStatus.Submitted ? 'View' : 'Review') as TaskAction,
        color: 'bg-indigo-500',
      }))
    : [];

  // Make sure selectedTask points to a valid task when displayTasks update
  useEffect(() => {
    if (displayTasks.length > 0) {
      // Find matching task or default to first
      const found = displayTasks.find(t => t.id === selectedTask?.id);
      if (found) {
        setSelectedTask(found);
      } else {
        setSelectedTask(displayTasks[0]);
      }
    }
  }, [apiTasks]);

  return {
    selectedTask,
    setSelectedTask,
    displayTasks,
    tasksLoading,
    tasksError,
    useMockFallback,
    apiTasksLength: apiTasks.length,
    fetchMyTasks,
    startTask,
    submitTask,
    isSubmitting,
    submissionMessage,
  };
}
