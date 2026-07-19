import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { fileApi } from '@/services/file-api';
import { TaskResponse } from '@/types/manga';
import { Task, TaskStatus, TaskPriority, TaskAction } from '@/types/assistant';
import { TASKS } from '@/data/mock/assistant.mock';

export function useAssistantDashboard() {
  const [selectedTask, setSelectedTask] = useState<Task>(TASKS[0]);
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

  const mapApiStatus = (s: string): TaskStatus => {
    if (s === 'InProgress') return 'In Progress';
    if (s === 'RevisionRequired') return 'Revision Required';
    return s as TaskStatus;
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
      if (currentTask && ['Pending', 'RevisionRequired'].includes(String(currentTask.status))) {
        await mangaApi.startTask(taskId);
      }

      const uploadRes = await fileApi.uploadFile(file, 'Submission', { source: 'assistant-ui' });
      if (!uploadRes.data?.success || !uploadRes.data.data?.id) {
        throw new Error(uploadRes.data?.message || 'The upload could not be completed.');
      }

      const submitRes = await mangaApi.submitTask(taskId, {
        fileId: uploadRes.data.data.id,
        note,
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

  const mapApiPriority = (p: string): TaskPriority => (p as TaskPriority) || 'Medium';

  const useMockFallback = tasksError !== null || (apiTasks.length === 0 && !tasksLoading && !tasksError);
  const displayTasks: Task[] = apiTasks.length > 0
    ? apiTasks.map((t) => ({
        id: t.id,
        title: t.title || t.description || 'Untitled task',
        series: t.seriesTitle || 'Studio workspace',
        chapter: t.chapterTitle ? `${t.chapterTitle} P${String(t.pageNumber ?? '?').padStart(2, '0')}` : `Page ${t.pageNumber ?? '?'}`,
        annotationType: t.description || 'Production task',
        priority: mapApiPriority(String(t.priority)),
        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : '—',
        deadlineOverdue: t.deadline ? new Date(t.deadline) < new Date() && t.status !== 'Approved' : false,
        status: mapApiStatus(String(t.status)),
        action: (String(t.status) === 'InProgress' ? 'Continue' : String(t.status) === 'RevisionRequired' ? 'Fix Now' : String(t.status) === 'Submitted' ? 'View' : 'Review') as TaskAction,
        color: 'bg-indigo-500',
      }))
    : TASKS;

  // Make sure selectedTask points to a valid task when displayTasks update
  useEffect(() => {
    if (displayTasks.length > 0) {
      // Find matching task or default to first
      const found = displayTasks.find(t => t.id === selectedTask.id);
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
