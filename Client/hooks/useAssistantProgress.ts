import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { TaskResponse, TaskStatus } from '@/types/manga';

export interface AssistantProgress {
  totalTasks: number;
  approvedTasks: number;
  inProgressTasks: number;
  revisionRequiredTasks: number;
  pendingTasks: number;
  approvedPages: number;
  completionPercentage: number;
}

export function useAssistantProgress() {
  const [progress, setProgress] = useState<AssistantProgress>({
    totalTasks: 0,
    approvedTasks: 0,
    inProgressTasks: 0,
    revisionRequiredTasks: 0,
    pendingTasks: 0,
    approvedPages: 0,
    completionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getMyTasks();
      if (res.data?.success) {
        const tasks = res.data.data || [];
        
        let approved = 0;
        let inProgress = 0;
        let revisionRequired = 0;
        let pending = 0;
        let approvedPages = 0;

        tasks.forEach((task: TaskResponse) => {
          if (task.status === TaskStatus.Approved) {
            approved++;
            approvedPages += task.pageNumber;
          } else if (task.status === TaskStatus.InProgress) {
            inProgress++;
          } else if (task.status === TaskStatus.RevisionRequired) {
            revisionRequired++;
          } else if (task.status === TaskStatus.Todo) {
            pending++;
          }
        });

        const completionPercentage = tasks.length > 0 
          ? Math.round((approved / tasks.length) * 100)
          : 0;

        setProgress({
          totalTasks: tasks.length,
          approvedTasks: approved,
          inProgressTasks: inProgress,
          revisionRequiredTasks: revisionRequired,
          pendingTasks: pending,
          approvedPages,
          completionPercentage,
        });
      } else {
        setError(res.data?.message || 'Failed to load progress.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not load progress.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProgress();
  }, []);

  return {
    progress,
    loading,
    error,
    fetchProgress,
  };
}
