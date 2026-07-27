import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { mangaApi } from '@/services/manga-api';
import { authApi } from '@/services/auth-api';
import { SeriesResponse, TaskResponse } from '@/types/manga';
import { TaskItem } from '@/components/mangaka/TaskTable';

export function useMangakaDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; title: string; content: string } | null>(null);

  const user = useAuthStore((state) => state.user);
  const [series, setSeries] = useState<SeriesResponse[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const fetchSeries = async () => {
    setSeriesLoading(true);
    setSeriesError(null);
    try {
      const res = await mangaApi.getSeries();
      if (res.data && res.data.success) {
        setSeries(res.data.data || []);
      } else {
        setSeriesError(res.data.message || 'Failed to load series.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not reach manga service. Please try again.';
      setSeriesError(msg);
    } finally {
      setSeriesLoading(false);
    }
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const [res, assistantsRes] = await Promise.all([mangaApi.getMyTasks(), authApi.getAssistants()]);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const assistantNames = new Map(
          assistantsRes.data?.success
            ? assistantsRes.data.data.map((assistant) => [assistant.id, assistant.fullName])
            : []
        );
        const mapped = res.data.data.map((task: TaskResponse) => ({
          id: task.id,
          taskName: task.title || task.description || 'Studio task',
          page: `P${task.pageNumber ?? '?'}`,
          assistant: assistantNames.get(task.assignedToUserId) || `User ${task.assignedToUserId.slice(0, 8)}`,
          status: task.status === 3 ? 'Submitted' : task.status === 4 ? 'Revision Required' : task.status === 1 ? 'Pending' : 'In Progress',
          priority: String(task.priority),
          deadline: task.deadline ? new Date(task.deadline).toLocaleDateString() : 'TBD',
          actionText: task.status === 3 ? 'Review' : 'Open',
        }));
        setTasks(mapped);
      } else {
        setTasksError(res.data?.message || 'No task stream available yet.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not reach task service.';
      setTasksError(msg);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
    fetchTasks();
  }, []);

  const triggerModal = (title: string, content: string) => {
    setModalInfo({ isOpen: true, title, content });
  };

  const handleTaskAction = async (taskId: string, actionType: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const response = await mangaApi.getTaskById(taskId);
      if (!response.data.success) throw new Error(response.data.message || 'Could not load task details.');
      const detail = response.data.data;

      if (actionType === 'Review') {
        triggerModal(
          `Editorial Review: ${detail.title}`,
          `Page ${detail.pageNumber} · Status: ${task.status} · Priority: ${task.priority}\n\n${detail.description || 'No description provided by the API.'}`
        );
      } else {
        triggerModal(
          `Task Detail: ${detail.title}`,
          `Page ${detail.pageNumber} · Assigned assistant: ${task.assistant}\nStatus: ${task.status}\nDeadline: ${task.deadline}\n\n${detail.description || 'No description provided by the API.'}`
        );
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      triggerModal(
        'Task unavailable',
        apiError.response?.data?.message || apiError.response?.data?.error || apiError.message || 'Could not load task details from the API.'
      );
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.assistant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    modalInfo,
    setModalInfo,
    triggerModal,
    tasks,
    setTasks,
    handleTaskAction,
    filteredTasks,
    series,
    seriesLoading,
    seriesError,
    fetchSeries,
    tasksLoading,
    tasksError,
    user,
  };
}
