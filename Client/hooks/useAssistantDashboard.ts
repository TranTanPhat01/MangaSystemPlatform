import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { TaskResponse } from '@/types/manga';
import { Task, TaskStatus, TaskPriority, TaskAction } from '@/types/assistant';
import { TASKS } from '@/data/mock/assistant.mock';

export function useAssistantDashboard() {
  const [selectedTask, setSelectedTask] = useState<Task>(TASKS[0]);
  const [apiTasks, setApiTasks] = useState<TaskResponse[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

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

  const mapApiPriority = (p: string): TaskPriority => p as TaskPriority;

  const useMockFallback = tasksError !== null || (apiTasks.length === 0 && !tasksLoading && !tasksError);
  const displayTasks: Task[] = apiTasks.length > 0
    ? apiTasks.map((t) => ({
        id: t.id,
        title: t.description || t.annotationType,
        series: t.seriesTitle || 'Unknown',
        chapter: t.chapterTitle ? `${t.chapterTitle} P${String(t.pageNumber ?? '?').padStart(2, '0')}` : '—',
        annotationType: t.annotationType,
        priority: mapApiPriority(t.priority),
        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : '—',
        deadlineOverdue: t.deadline ? new Date(t.deadline) < new Date() && t.status !== 'Approved' : false,
        status: mapApiStatus(t.status),
        action: (t.status === 'InProgress' ? 'Continue' : t.status === 'RevisionRequired' ? 'Fix Now' : t.status === 'Submitted' ? 'View' : 'Review') as TaskAction,
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
  };
}
