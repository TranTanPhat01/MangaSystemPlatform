import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewCard } from '@/app/editorial/page';
import { ReviewStatus, type EditorialReviewResponse } from '@/types/editorial';

const api = vi.hoisted(() => ({
  getReview: vi.fn(), getReviewComments: vi.fn(), startReview: vi.fn(),
  addReviewComment: vi.fn(), approveReview: vi.fn(), requestReviewRevision: vi.fn(), rejectReview: vi.fn(),
}));

vi.mock('@/services/editorial-api', () => ({ editorialApi: api }));

const review: EditorialReviewResponse = {
  id: 'review-1', chapterId: 'chapter-1', seriesId: 'series-1', requestedByUserId: 'creator-1',
  status: ReviewStatus.InReview, createdAt: '2026-01-01T00:00:00Z',
};

describe('Editorial review UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.approveReview.mockResolvedValue({ data: { success: true, data: review } });
    api.getReview.mockResolvedValue({ data: { success: true, data: { ...review, status: ReviewStatus.Approved } } });
    api.getReviewComments.mockResolvedValue({ data: { success: true, data: [] } });
  });

  it('sends the decision note and refreshes the detail and queue after approval', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<ReviewCard review={review} canManage onRefresh={onRefresh} />);

    fireEvent.change(screen.getByLabelText('Decision note'), { target: { value: 'Ready to publish.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(api.approveReview).toHaveBeenCalledWith('review-1', { decisionNote: 'Ready to publish.' }));
    await waitFor(() => expect(api.getReviewComments).toHaveBeenCalledWith('review-1'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
