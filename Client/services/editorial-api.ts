/**
 * Editorial API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 * Route: /editorial/**
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import {
  EditorialReviewResponse,
  EditorialCommentResponse,
  CreateEditorialCommentRequest,
  DecisionRequest,
  BoardVoteSummaryResponse,
  VoteProposalRequest,
  RankingSnapshotResponse,
  PublicationScheduleResponse,
  CreatePublicationScheduleRequest,
  ReaderVoteInputRequest,
  FinalizeProposalRequest,
  IssueResponse,
  CreateIssueRequest,
  UpdateIssueStatusRequest,
  RankingItemResponse,
  CancellationWarningResponse,
} from '@/types/editorial';


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
  getReview: (id: string) =>
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
  getReviewComments: (id: string) =>
    api.get<ApiResponse<EditorialCommentResponse[]>>(`/editorial/reviews/${id}/comments`),

  addReviewComment: (id: string, data: CreateEditorialCommentRequest) =>
    api.post<ApiResponse<EditorialCommentResponse>>(`/editorial/reviews/${id}/comments`, data),

  /**
   * POST /editorial/reviews/{id}/approve
   */
  approveReview: (id: string, data: DecisionRequest) =>
    api.post<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}/approve`, data),

  /**
   * POST /editorial/reviews/{id}/request-revision
   */
  requestReviewRevision: (id: string, data: DecisionRequest) =>
    api.post<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}/request-revision`, data),

  /**
   * POST /editorial/reviews/{id}/reject
   */
  rejectReview: (id: string, data: DecisionRequest) =>
    api.post<ApiResponse<EditorialReviewResponse>>(`/editorial/reviews/${id}/reject`, data),

  // ─── Proposals (Editorial Board) ──────────────────────────────────────────

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
  finalizeProposal: (seriesId: string, data: FinalizeProposalRequest) =>
    api.post<ApiResponse<BoardVoteSummaryResponse>>(`/editorial/series/${seriesId}/finalize-proposal`, data),


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
  getPublicationSchedule: (scheduleId: string) =>
    api.get<ApiResponse<PublicationScheduleResponse>>(`/editorial/publication-schedules/${scheduleId}`),
  publishPublicationSchedule: (scheduleId: string) =>
    api.post<ApiResponse<PublicationScheduleResponse>>(`/editorial/publication-schedules/${scheduleId}/publish`),

  // ─── Reader Voting & Rankings ─────────────────────────────────────────────

  /**
   * POST /editorial/reader-votes
   * Input reader vote counts for a series in a given period
   */
  createIssue: (data: CreateIssueRequest) =>
    api.post<ApiResponse<IssueResponse>>('/editorial/issues', data),
  getIssues: () => api.get<ApiResponse<IssueResponse[]>>('/editorial/issues'),
  getIssue: (issueId: string) =>
    api.get<ApiResponse<IssueResponse>>(`/editorial/issues/${issueId}`),
  updateIssueStatus: (issueId: string, data: UpdateIssueStatusRequest) =>
    api.patch<ApiResponse<IssueResponse>>(`/editorial/issues/${issueId}/status`, data),
  inputReaderVote: (issueId: string, data: ReaderVoteInputRequest) =>
    api.post<ApiResponse<unknown>>(`/editorial/issues/${issueId}/reader-votes`, data),

  /**
   * POST /editorial/rankings/calculate
   * Triggers ranking recalculation
   */
  calculateRanking: (issueId: string) =>
    api.post<ApiResponse<RankingSnapshotResponse>>(`/editorial/issues/${issueId}/calculate-ranking`),

  /**
   * GET /editorial/rankings
   */
  getRankings: (issueId: string) =>
    api.get<ApiResponse<RankingSnapshotResponse[]>>(`/editorial/issues/${issueId}/rankings`),

  getSeriesRankingHistory: (seriesId: string) =>
    api.get<ApiResponse<RankingItemResponse[]>>(`/editorial/series/${seriesId}/ranking-history`),
  getCancellationWarnings: (seriesId: string) =>
    api.get<ApiResponse<CancellationWarningResponse[]>>(`/editorial/series/${seriesId}/cancellation-warnings`),
  getAllCancellationWarnings: () =>
    api.get<ApiResponse<CancellationWarningResponse[]>>('/editorial/issues/cancellation-warnings'),
  setSeriesHiatus: (seriesId: string) =>
    api.post<ApiResponse<PublicationScheduleResponse>>(`/editorial/series/${seriesId}/hiatus`),
  cancelSeries: (seriesId: string) =>
    api.post<ApiResponse<PublicationScheduleResponse>>(`/editorial/series/${seriesId}/cancel`),
};
