import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { mangaApi } from '@/services/manga-api';
import { SeriesResponse } from '@/types/manga';
import { TaskItem } from '@/components/mangaka/TaskTable';
import { INITIAL_TASKS } from '@/data/mock/mangaka.mock';

export function useMangakaDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; title: string; content: string } | null>(null);

  // Real series data from API
  const user = useAuthStore((state) => state.user);
  const [series, setSeries] = useState<SeriesResponse[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);

  // Tasks mock state
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);

  const fetchSeries = async () => {
    setSeriesLoading(true);
    setSeriesError(null);
    try {
      const res = await mangaApi.getSeries();
      if (res.data && res.data.success) {
        setSeries(res.data.data);
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

  useEffect(() => {
    fetchSeries();
  }, []);

  const triggerModal = (title: string, content: string) => {
    setModalInfo({ isOpen: true, title, content });
  };

  const handleTaskAction = (taskId: string, actionType: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (actionType === 'Review') {
      triggerModal(
        `Editorial Review: ${task.taskName}`,
        `Reviewing page asset ${task.page} created by Assistant ${task.assistant}. Current status is "${task.status}" with ${task.priority} priority. Action required: Approve, request revisions, or add layout feedback.`
      );
    } else {
      triggerModal(
        `Open Task Detail`,
        `Opening detail board for "${task.taskName}" (${task.page}) assigned to ${task.assistant}. Deadline set for ${task.deadline}. You can edit guidelines or chat with the assistant here.`
      );
    }
  };

  const filteredTasks = tasks.filter(t => 
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
    user
  };
}
