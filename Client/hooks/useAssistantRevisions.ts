import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { TaskResponse, TaskStatus } from '@/types/manga';

export interface RevisionRequest {
  taskId: string;
  pageNumber: number;
  chapterInfo: string;
  reason: string;
  requestedDate: string;
}

export function useAssistantRevisions() {
  const [revisions, setRevisions] = useState<RevisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getMyTasks();
      if (res.data?.success) {
        const tasks = res.data.data || [];
        // Filter only tasks with RevisionRequired status
        const revisionTasks = tasks.filter(
          (task: TaskResponse) => task.status === TaskStatus.RevisionRequired
        );
        
        const mapped: RevisionRequest[] = revisionTasks.map((task: TaskResponse) => {
          const latestRevision = task.revisions && task.revisions.length > 0
            ? task.revisions[task.revisions.length - 1]
            : null;
          return {
            taskId: task.id,
            pageNumber: task.pageNumber,
            chapterInfo: `Chapter ${task.pageNumber}`,
            reason: latestRevision?.reason || 'Revisions requested',
            requestedDate: latestRevision?.createdAt
              ? new Date(latestRevision.createdAt).toLocaleDateString()
              : new Date(task.updatedAt || task.createdAt).toLocaleDateString(),
          };
        });
        
        setRevisions(mapped);
      } else {
        setError(res.data?.message || 'Failed to load revisions.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not load revisions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRevisions();
  }, []);

  return {
    revisions,
    loading,
    error,
    fetchRevisions,
  };
}
