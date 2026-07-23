import { useState, useEffect, useCallback } from 'react';
import { mangaApi } from '@/services/manga-api';
import { AnnotationResponse, AnnotationType } from '@/types/manga';

export interface AnnotationData {
  type: AnnotationType;
  description?: string;
  notes?: string;
  coordinatesJson?: string; // JSON string of {x, y, width, height}
}

export function usePageAnnotations(pageId: string | null) {
  const [annotations, setAnnotations] = useState<AnnotationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnotations = useCallback(async () => {
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
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.response?.data?.error || 'Could not load annotations.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  const createAnnotation = async (annotationData: AnnotationData) => {
    if (!pageId) return false;

    try {
      const res = await mangaApi.createAnnotation(pageId, {
        type: annotationData.type,
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
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.response?.data?.error || 'Could not create annotation.';
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
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.response?.data?.error || 'Could not delete annotation.';
      setError(msg);
      return false;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      void fetchAnnotations();
    }, 0);
  }, [fetchAnnotations]);

  return {
    annotations,
    loading,
    error,
    fetchAnnotations,
    createAnnotation,
    deleteAnnotation,
  };
}
