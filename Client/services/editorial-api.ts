/**
 * Editorial API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 * Route: /editorial/**
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import {
  EditorialReviewResponse,
  ReviewCommentResponse,
  AddCommentRequest,
  RequestRevisionRequest,
  RejectReviewRequest,
  SeriesProposalResponse,
  BoardVoteSummaryResponse,
  VoteProposalRequest,
  RankingResponse,
  PublicationScheduleResponse,
  CreatePublicationScheduleRequest,
  ReaderVoteInputRequest,
} from '@/types/editorial';

import { mangaApi } from '@/services/manga-api';

export const editorialApi = {
  // ─── Reviews ─────────────────────────────────────────────────────────────

  /**
   * GET /editorial/reviews
   * Returns all chapter review submissions (Tantou Editor view)
   */
  getReviews: () =>
    api.get<ApiResponse<EditorialReviewResponse[]>>('/editorial/reviews'),

  /**
   * GET /editorial/reviews/{id}
   */
  getReviewById: (id: string) =>
    api.get<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}`),

  /**
   * POST /editorial/reviews/{id}/start
   * Tantou Editor claims & starts a review
   */
  startReview: (id: string) =>
    api.post<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}/start`),

  /**
   * POST /editorial/reviews/{id}/comments
   */
  addComment: (id: string, data: AddCommentRequest) =>
    api.post<ApiResponse<ReviewCommentResponse>>(`/editorial/reviews/${id}/comments`, data),

  /**
   * POST /editorial/reviews/{id}/approve
   */
  approveReview: (id: string) =>
    api.post<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}/approve`),

  /**
   * POST /editorial/reviews/{id}/request-revision
   */
  requestRevision: (id: string, data: RequestRevisionRequest) =>
    api.post<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}/request-revision`, data),

  /**
   * POST /editorial/reviews/{id}/reject
   */
  rejectReview: (id: string, data: RejectReviewRequest) =>
    api.post<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}/reject`, data),

  // ─── Proposals (Editorial Board) ──────────────────────────────────────────

  /**
   * GET /editorial/proposals
   * Fallback implementation filtering series from mangaApi since backend /editorial/proposals might not exist
   */
  getProposals: async () => {
    const res = await mangaApi.getSeries();
    if (res.data && res.data.success) {
      const proposals: SeriesProposalResponse[] = res.data.data.map((s) => ({
        id: s.id,
        seriesId: s.id,
        seriesTitle: s.title,
        mangakaId: s.mangakaId,
        mangakaName: s.mangakaName,
        genre: s.genre,
        synopsis: s.description,
        status: (s.status === 'Draft' ? 'Voting' : s.status === 'Active' ? 'Approved' : 'Pending') as any,
        submittedAt: s.createdAt,
      }));
      return {
        ...res,
        data: {
          ...res.data,
          data: proposals,
        },
      };
    }
    return res as any;
  },

  /**
   * POST /editorial/series/{seriesId}/votes
   */
  voteProposal: (seriesId: string, data: VoteProposalRequest) =>
    api.post<ApiResponse<BoardVoteSummaryResponse>>(`/editorial/series/${seriesId}/votes`, data),

  /**
   * GET /editorial/series/{seriesId}/vote-summary
   */
  getVoteSummary: (seriesId: string) =>
    api.get<ApiResponse<BoardVoteSummaryResponse>>(`/editorial/series/${seriesId}/vote-summary`),

  /**
   * POST /editorial/series/{seriesId}/finalize-proposal
   */
  finalizeProposal: (seriesId: string) =>
    api.post<ApiResponse<SeriesProposalResponse>>(`/editorial/series/${seriesId}/finalize-proposal`),


  // ─── Publication Schedule ─────────────────────────────────────────────────

  /**
   * GET /editorial/publication-schedules
   */
  getPublicationSchedules: () =>
    api.get<ApiResponse<PublicationScheduleResponse[]>>('/editorial/publication-schedules'),

  /**
   * POST /editorial/publication-schedules
   */
  createPublicationSchedule: (data: CreatePublicationScheduleRequest) =>
    api.post<ApiResponse<PublicationScheduleResponse>>('/editorial/publication-schedules', data),

  // ─── Reader Voting & Rankings ─────────────────────────────────────────────

  /**
   * POST /editorial/reader-votes
   * Input reader vote counts for a series in a given period
   */
  inputReaderVote: (data: ReaderVoteInputRequest) =>
    api.post<ApiResponse<null>>('/editorial/reader-votes', data),

  /**
   * POST /editorial/rankings/calculate
   * Triggers ranking recalculation
   */
  calculateRanking: () =>
    api.post<ApiResponse<RankingResponse[]>>('/editorial/rankings/calculate'),

  /**
   * GET /editorial/rankings
   */
  getRankings: () =>
    api.get<ApiResponse<RankingResponse[]>>('/editorial/rankings'),
};
