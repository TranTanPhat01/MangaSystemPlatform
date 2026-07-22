import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { fileApi } from '@/services/file-api';
import { TaskResponse, TaskStatus, TaskPriority } from '@/types/manga';
import { FileCategory } from '@/types/file';

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
  isMock: boolean;
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItemUI[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItemUI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [useMockFallback, setUseMockFallback] = useState(false);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  const mapApiStatus = (s: string): TaskStatus => {
    if (s === 'InProgress') return 'InProgress';
    if (s === 'RevisionRequired') return 'RevisionRequired';
    return s as TaskStatus;
  };

  const getActionForStatus = (status: TaskStatus): TaskItemUI['action'] => {
    if (status === 'Pending') return 'Start';
    if (status === 'InProgress') return 'Continue';
    if (status === 'RevisionRequired') return 'Fix Now';
    if (status === 'Submitted') return 'View';
    return 'Review';
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    setUseMockFallback(false);
    try {
      const res = await mangaApi.getMyTasks();
      if (res.data && res.data.success) {
        const apiData = res.data.data;
        if (apiData && apiData.length > 0) {
          const uiTasks: TaskItemUI[] = apiData.map((t) => ({
            id: t.id,
            title: t.title || t.description || t.annotationType || 'Untitled task',
            series: t.seriesTitle || 'Unknown Series',
            chapter: t.chapterTitle ? `${t.chapterTitle} P${String(t.pageNumber ?? '?').padStart(2, '0')}` : '—',
            annotationType: t.annotationType || t.description || 'Production task',
            priority: String(t.priority) as TaskPriority,
            deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : '—',
            deadlineOverdue: t.deadline ? new Date(t.deadline) < new Date() && t.status !== 'Approved' : false,
            status: mapApiStatus(String(t.status)),
            action: getActionForStatus(mapApiStatus(String(t.status))),
            color: 'bg-indigo-500',
            pageFileAssetId: t.fileAssetId || undefined,
            isMock: false,
          }));
          setTasks(uiTasks);
          // Set first task as selected by default if nothing selected
          if (uiTasks.length > 0) {
            setSelectedTask(uiTasks[0]);
          }
        } else {
          setTasks([]);
          setSelectedTask(null);
        }
      } else {
        setError(res.data?.message || 'Failed to fetch tasks.');
        loadMockFallback();
      }
    } catch (err: any) {
      handleApiError(err, 'fetch list of');
      loadMockFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockFallback = () => {
    setUseMockFallback(true);
    // Standard mock tasks mapped to UI types
    const mockTasksList: TaskItemUI[] = [
      {
        id: 'mock-t1',
        title: 'Background Drawing',
        series: 'Blue Moon',
        chapter: 'Ch.12 Page 05',
        annotationType: 'Background',
        priority: 'High',
        deadline: 'Today',
        status: 'InProgress',
        action: 'Continue',
        color: 'bg-indigo-500',
        isMock: true,
      },
      {
        id: 'mock-t2',
        title: 'Character Shading',
        series: 'Blue Moon',
        chapter: 'Ch.12 Page 08',
        annotationType: 'Shading',
        priority: 'Medium',
        deadline: 'Tomorrow',
        status: 'Submitted',
        action: 'View',
        color: 'bg-emerald-500',
        isMock: true,
      },
      {
        id: 'mock-t3',
        title: 'Speed Effect',
        series: 'Re:Birth',
        chapter: 'Ch.03 Page 10',
        annotationType: 'Effects',
        priority: 'Urgent',
        deadline: 'Overdue',
        deadlineOverdue: true,
        status: 'RevisionRequired',
        action: 'Fix Now',
        color: 'bg-rose-500',
        isMock: true,
      }
    ];
    setTasks(mockTasksList);
    setSelectedTask(mockTasksList[0]);
  };

  const selectTask = (task: TaskItemUI) => {
    setSelectedTask(task);
  };

  const startTask = async (id: string) => {
    setIsStarting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await mangaApi.startTask(id);
      if (res.data && res.data.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: 'InProgress', action: 'Continue' } : t
          )
        );
        // Sync selected task
        if (selectedTask && selectedTask.id === id) {
          setSelectedTask((prev) => prev ? { ...prev, status: 'InProgress', action: 'Continue' } : null);
        }
        setSuccessMessage('Nhiệm vụ đã được bắt đầu thực hiện.');
      } else {
        setError(res.data?.message || 'Không thể bắt đầu thực hiện tác vụ.');
      }
    } catch (err: any) {
      handleApiError(err, 'start');
    } finally {
      setIsStarting(false);
    }
  };

  const submitTask = async (id: string, file: File, note?: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // 1. Upload file first
      const uploadRes = await fileApi.uploadFile(file, 'Submission');
      if (!uploadRes.data || !uploadRes.data.success) {
        throw new Error(uploadRes.data?.message || 'Failed to upload source file for submission.');
      }

      const fileAssetId = uploadRes.data.data.id;

      // 2. Submit task with fileId
      const submitRes = await mangaApi.submitTask(id, {
        fileId: fileAssetId,
        note: note,
      });


      if (submitRes.data && submitRes.data.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: 'Submitted', action: 'View', submittedFileAssetId: fileAssetId } : t
          )
        );
        // Sync selected task
        if (selectedTask && selectedTask.id === id) {
          setSelectedTask((prev) =>
            prev ? { ...prev, status: 'Submitted', action: 'View', submittedFileAssetId: fileAssetId } : null
          );
        }
        setSuccessMessage('Nhiệm vụ đã được nộp bản vẽ thành công.');
      } else {
        setError(submitRes.data?.message || 'Không thể gửi bản vẽ hoàn tất.');
      }
    } catch (err: any) {
      handleApiError(err, 'submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPageAsset = async (fileAssetId: string, fileName: string) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fileApi.downloadFile(fileAssetId);
      const blob = res.data;
      if (!(blob instanceof Blob)) {
        throw new Error('Tệp không đúng định dạng nhị phân.');
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMessage(`Đã tải xuống tệp nguồn: "${fileName}"`);
    } catch (err: any) {
      handleApiError(err, 'download reference resource for');
    }
  };

  const handleApiError = (err: any, action: string) => {
    const status = err.response?.status;
    let msg = `Có lỗi xảy ra khi thực hiện ${action} nhiệm vụ.`;

    if (status === 401) {
      msg = 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
    } else if (status === 403) {
      msg = 'Bạn không có quyền thao tác task này.';
    } else if (status === 404) {
      msg = 'Tác vụ hoặc file không tồn tại.';
    } else if (status === 409 || status === 400) {
      msg = err.response?.data?.message || err.response?.data?.error || msg;
    } else if (status >= 500) {
      msg = 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
    } else {
      msg = err.response?.data?.message || err.message || msg;
    }

    setError(msg);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    selectedTask,
    isLoading,
    isStarting,
    isSubmitting,
    error,
    successMessage,
    useMockFallback,
    fetchTasks,
    selectTask,
    startTask,
    submitTask,
    downloadPageAsset,
    clearError,
    clearSuccess,
  };
}
