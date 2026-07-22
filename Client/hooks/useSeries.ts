import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { SeriesResponse, CreateSeriesRequest } from '@/types/manga';

export function useSeries() {
  const [series, setSeries] = useState<SeriesResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  const fetchSeries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getSeries();
      if (res.data && res.data.success) {
        setSeries(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to fetch series.');
      }
    } catch (err: any) {
      handleApiError(err, 'fetch list of');
    } finally {
      setIsLoading(false);
    }
  };

  const createSeries = async (payload: CreateSeriesRequest) => {
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await mangaApi.createSeries(payload);
      if (res.data && res.data.success) {
        const newSeries = res.data.data;
        setSeries((prev) => [newSeries, ...prev]);
        setSuccessMessage(`Series "${newSeries.title}" created successfully!`);
        return newSeries;
      } else {
        setError(res.data?.message || 'Failed to create series.');
      }
    } catch (err: any) {
      handleApiError(err, 'create');
    } finally {
      setIsCreating(false);
    }
  };

  const submitProposal = async (id: string) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await mangaApi.submitProposal(id);
      if (res.data && res.data.success) {
        setSeries((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: 2 } : s
          )
        );
        setSuccessMessage('Series proposal submitted successfully.');
      } else {
        setError(res.data?.message || 'Failed to submit proposal.');
      }
    } catch (err: any) {
      handleApiError(err, 'submit proposal for');
    }
  };

  const handleApiError = (err: any, action: string) => {
    const status = err.response?.status;
    let msg = `An error occurred while trying to ${action} series.`;

    if (status === 401) {
      msg = 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
    } else if (status === 403) {
      msg = 'Bạn không có quyền thực hiện hành động này.';
    } else if (status === 404) {
      msg = 'Series không tồn tại trên hệ thống.';
    } else if (status >= 500) {
      msg = 'Dịch vụ manga tạm thời không khả dụng. Vui lòng thử lại sau.';
    } else {
      msg = err.response?.data?.message || err.message || msg;
    }

    setError(msg);
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  return {
    series,
    isLoading,
    error,
    isCreating,
    successMessage,
    fetchSeries,
    createSeries,
    submitProposal,
    clearError,
    clearSuccess,
  };
}
