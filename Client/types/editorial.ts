// ─── Editorial Domain DTOs ────────────────────────────────────────────────────

export type ReviewStatus =
  | 'Pending'
  | 'InProgress'
  | 'Approved'
  | 'RevisionRequested'
  | 'Rejected';

export type VoteDecision = 'Approve' | 'Revise' | 'Reject';
export type ProposalStatus = 'Pending' | 'Voting' | 'Approved' | 'Rejected' | 'Finalized';
export type PublicationType = 'Weekly' | 'Monthly' | 'Special';

export interface EditorialReviewResponse {
  id: string;
  chapterId: string;
  chapterTitle?: string;
  seriesId?: string;
  seriesTitle?: string;
  mangakaId?: string;
  mangakaName?: string;
  reviewerId?: string;
  reviewerName?: string;
  status: ReviewStatus;
  submittedAt: string;
  startedAt?: string;
  resolvedAt?: string;
  comments?: ReviewCommentResponse[];
}

export interface ReviewCommentResponse {
  id: string;
  reviewId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt: string;
}

export interface AddCommentRequest {
  content: string;
}

export interface RequestRevisionRequest {
  notes: string;
}

export interface RejectReviewRequest {
  reason: string;
}

export interface SeriesProposalResponse {
  id: string;
  seriesId: string;
  seriesTitle?: string;
  mangakaId: string;
  mangakaName?: string;
  genre?: string;
  synopsis?: string;
  status: ProposalStatus;
  editorRecommendation?: 'Recommended' | 'NeedsDiscussion' | 'NotRecommended';
  submittedAt: string;
  voteSummary?: BoardVoteSummaryResponse;
}

export interface BoardVoteSummaryResponse {
  proposalId: string;
  totalVotes: number;
  approveCount: number;
  reviseCount: number;
  rejectCount: number;
  approvePercent: number;
  revisePercent: number;
  rejectPercent: number;
  quorumMet: boolean;
  currentUserVote?: VoteDecision | null;
}

export interface VoteProposalRequest {
  decision: VoteDecision;
  comment?: string;
}

export interface RankingResponse {
  id: string;
  seriesId: string;
  seriesTitle?: string;
  mangakaName?: string;
  rank: number;
  previousRank?: number;
  readerVotes: number;
  weeklyVotes?: number;
  trend: 'Up' | 'Down' | 'Same' | 'New';
  calculatedAt: string;
}

export interface PublicationScheduleResponse {
  id: string;
  seriesId: string;
  seriesTitle?: string;
  publicationType: PublicationType;
  scheduledDate: string;
  isPublished: boolean;
  publishedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePublicationScheduleRequest {
  seriesId: string;
  publicationType: PublicationType;
  scheduledDate: string;
  notes?: string;
}

export interface ReaderVoteInputRequest {
  seriesId: string;
  voteCount: number;
  weekLabel?: string;
}
