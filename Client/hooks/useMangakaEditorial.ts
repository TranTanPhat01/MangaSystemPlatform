import { useState, useEffect } from 'react';
import { editorialApi } from '@/services/editorial-api';
import { EditorialReviewResponse, EditorialCommentResponse } from '@/types/editorial';

export interface MangakaEditorialFeedback {
  reviewId: string;
  chapterId: string;
  chapterTitle: string;
  status: string;
  lastCommentDate: string;
  comments: EditorialCommentResponse[];
  editorName?: string;
  note?: string;
}

export function useMangakaEditorial() {
  const [reviews, setReviews] = useState<MangakaEditorialFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEditorialFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await editorialApi.getReviews();
      if (res.data?.success) {
        const mappedReviews: MangakaEditorialFeedback[] = await Promise.all(
          (res.data.data || []).map(async (review: EditorialReviewResponse) => {
            try {
              const commentsRes = await editorialApi.getReviewComments(review.id);
              const comments = commentsRes.data?.success ? commentsRes.data.data || [] : [];
              const lastComment = comments.length > 0 ? comments[comments.length - 1] : null;
              
              return {
                reviewId: review.id,
                chapterId: review.chapterId,
                chapterTitle: `Chapter ${review.chapterId.toString().slice(0, 8)}`,
                status: mapReviewStatus(review.status),
                lastCommentDate: lastComment?.createdAt 
                  ? new Date(lastComment.createdAt).toLocaleDateString()
                  : 'No comments',
                comments,
                editorName: review.reviewerUserId ? `Reviewer ID ${review.reviewerUserId}` : 'Unassigned',
                note: lastComment?.commentText || review.decisionNote || 'No notes',
              };
            } catch {
              return {
                reviewId: review.id,
                chapterId: review.chapterId,
                chapterTitle: `Chapter ${review.chapterId.toString().slice(0, 8)}`,
                status: mapReviewStatus(review.status),
                lastCommentDate: 'No data',
                comments: [],
              };
            }
          })
        );
        setReviews(mappedReviews);
      } else {
        setError(res.data?.message || 'Failed to load editorial feedback.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not load editorial feedback.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const mapReviewStatus = (status: number | string): string => {
    const statusMap: Record<string | number, string> = {
      '1': 'Pending',
      '2': 'In Review',
      '3': 'Revision Required',
      '4': 'Approved',
      '5': 'Rejected',
    };
    return statusMap[status] || 'Unknown';
  };

  useEffect(() => {
    void fetchEditorialFeedback();
  }, []);

  return {
    reviews,
    loading,
    error,
    fetchEditorialFeedback,
  };
}
