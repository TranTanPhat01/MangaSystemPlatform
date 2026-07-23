import { useState, useEffect } from 'react';
import { mangaApi } from '@/services/manga-api';
import { AnnotationResponse } from '@/types/manga';

export interface AnnotationData {
  type: string; // 'comment' | 'highlight' | 'error' | 'correction'
  description?: string;
  notes?: string;
  coordinatesJson?: string; // JSON string of {x, y, width, height}
}

export function usePageAnnotations(pageId: string | null) {
  const [annotations, setAnnotations] = useState<AnnotationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnotations = async () => {
    if (!pageId) {
      setAnnotations([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getPageAnnotations(pageId);
      if (res.data?.success) {
        setAnnotations(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load annotations.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not load annotations.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const createAnnotation = async (annotationData: AnnotationData) => {
    if (!pageId) return false;

    try {
      const res = await mangaApi.createAnnotation(pageId, {
        type: annotationData.type as any,
        description: annotationData.description,
        notes: annotationData.notes,
        coordinatesJson: annotationData.coordinatesJson,
      });

      if (res.data?.success) {
        await fetchAnnotations();
        return true;
      } else {
        setError(res.data?.message || 'Failed to create annotation.');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not create annotation.';
      setError(msg);
      return false;
    }
  };

  const deleteAnnotation = async (annotationId: string) => {
    try {
      const res = await mangaApi.deleteAnnotation(annotationId);
      if (res.data?.success) {
        await fetchAnnotations();
        return true;
      } else {
        setError(res.data?.message || 'Failed to delete annotation.');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not delete annotation.';
      setError(msg);
      return false;
    }
  };

  useEffect(() => {
    void fetchAnnotations();
  }, [pageId]);

  return {
    annotations,
    loading,
    error,
    fetchAnnotations,
    createAnnotation,
    deleteAnnotation,
  };
}
