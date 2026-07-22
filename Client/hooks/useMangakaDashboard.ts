import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { mangaApi } from '@/services/manga-api';
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
      const res = await mangaApi.getMyTasks();
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map((task: TaskResponse) => ({
          id: task.id,
          taskName: task.title || task.description || 'Studio task',
          page: `P${task.pageNumber ?? '?'}`,
          assistant: task.assignedToUserId.slice(0, 8),
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

  const handleTaskAction = (taskId: string, actionType: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (actionType === 'Review') {
      triggerModal(
        `Editorial Review: ${task.taskName}`,
        `Reviewing page asset ${task.page} created by ${task.assistant}. Current status is "${task.status}" with ${task.priority} priority. Action required: Approve, request revisions, or add layout feedback.`
      );
    } else {
      triggerModal(
        `Open Task Detail`,
        `Opening detail board for "${task.taskName}" (${task.page}) assigned to ${task.assistant}. Deadline set for ${task.deadline}. You can edit guidelines or chat with the assistant here.`
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
