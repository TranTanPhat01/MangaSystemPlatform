// ─── Editorial Domain DTOs ────────────────────────────────────────────────────

// The Editorial API has no JsonStringEnumConverter configuration, so ASP.NET
// serializes EditorialReviewStatus as the numeric values below.
export enum ReviewStatus {
  Pending = 1,
  InReview = 2,
  RevisionRequested = 3,
  Approved = 4,
  Rejected = 5,
}

export enum BoardVoteValue { Approve = 1, Reject = 2, Revision = 3, Abstain = 4 }
export type VoteDecision = 'Approve' | 'Revise' | 'Reject';
export enum PublicationType { Weekly = 1, Monthly = 2, OneShot = 3, SpecialIssue = 4 }
export enum PublicationStatus { Scheduled = 1, Published = 2, Hiatus = 3, Cancelled = 4 }

export interface EditorialReviewResponse {
  id: string;
  chapterId: string;
  seriesId: string;
  requestedByUserId: string;
  reviewerUserId?: string | null;
  status: ReviewStatus;
  decisionNote?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  latestComment?: EditorialCommentResponse | null;
}

export interface EditorialCommentResponse {
  id: string;
  reviewId: string;
  pageId?: string | null;
  annotationId?: string | null;
  commentText: string;
  createdByUserId: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface CreateEditorialCommentRequest {
  commentText: string;
  pageId?: string;
  annotationId?: string;
}

export interface DecisionRequest {
  decisionNote?: string;
}

export interface BoardVoteSummaryResponse { seriesId: string; approve: number; reject: number; revision: number; abstain: number; total: number; quorumReached: boolean; finalRecommendation: string; }

export interface VoteProposalRequest { proposalId?: string; voteValue: BoardVoteValue; note?: string; }
export interface FinalizeProposalRequest { adminOverride: boolean; reason?: string; }

export interface RankingItemResponse {
  seriesId: string;
  voteCount: number;
  rankPosition: number;
  previousRank?: number | null;
  positiveRate: number;
  trend: string;
  riskLevel: string;
  score: number;
  snapshotGeneratedAt?: string | null;
}
export interface RankingSnapshotResponse { id: string; issueId: string; generatedAt: string; generatedByUserId: string; items: RankingItemResponse[]; }
export enum CancellationRiskLevel { Low = 1, Medium = 2, High = 3, Critical = 4 }
export interface CancellationWarningResponse { id: string; seriesId: string; reason: string; riskLevel: CancellationRiskLevel; createdAt: string; isResolved: boolean; resolvedAt?: string | null; }

export interface PublicationScheduleResponse {
  id: string;
  seriesId: string;
  chapterId: string;
  issueId?: string | null;
  publicationType: PublicationType;
  scheduledDate: string;
  status: PublicationStatus;
  publishedAt?: string | null;
  createdAt: string;
}

export interface CreatePublicationScheduleRequest {
  seriesId: string;
  chapterId: string;
  issueId?: string;
  publicationType: PublicationType;
  scheduledDate: string;
}

export interface ReaderVoteInputRequest {
  seriesId: string;
  voteCount: number;
}
export enum IssueStatus { Draft = 1, Scheduled = 2, Released = 3, Archived = 4 }
export interface CreateIssueRequest {
  issueNumber: string;
  title: string;
  releaseDate: string;
}
export interface UpdateIssueStatusRequest { status: IssueStatus; }
export interface IssueResponse { id: string; issueNumber: string; title: string; releaseDate: string; status: IssueStatus; createdAt: string; }
