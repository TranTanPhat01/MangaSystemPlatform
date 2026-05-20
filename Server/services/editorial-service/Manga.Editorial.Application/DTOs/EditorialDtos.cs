using System.ComponentModel.DataAnnotations;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Application.DTOs;

public sealed class CreateEditorialReviewRequest { public Guid ChapterId { get; set; } public Guid SeriesId { get; set; } public Guid? ReviewerUserId { get; set; } }
public sealed class EditorialReviewResponse { public Guid Id { get; set; } public Guid ChapterId { get; set; } public Guid SeriesId { get; set; } public Guid RequestedByUserId { get; set; } public Guid? ReviewerUserId { get; set; } public EditorialReviewStatus Status { get; set; } public string? DecisionNote { get; set; } public DateTime CreatedAt { get; set; } public DateTime? UpdatedAt { get; set; } }
public sealed class CreateEditorialCommentRequest { public Guid? PageId { get; set; } public Guid? AnnotationId { get; set; } [Required] public string CommentText { get; set; } = string.Empty; }
public sealed class EditorialCommentResponse { public Guid Id { get; set; } public Guid ReviewId { get; set; } public Guid? PageId { get; set; } public Guid? AnnotationId { get; set; } public string CommentText { get; set; } = string.Empty; public Guid CreatedByUserId { get; set; } public bool IsResolved { get; set; } public DateTime CreatedAt { get; set; } public DateTime? ResolvedAt { get; set; } }
public sealed class DecisionRequest { public string? DecisionNote { get; set; } }

public sealed class BoardVoteRequest { public Guid? ProposalId { get; set; } public BoardVoteValue VoteValue { get; set; } public string? Note { get; set; } }
public sealed class BoardVoteResponse { public Guid Id { get; set; } public Guid SeriesId { get; set; } public Guid? ProposalId { get; set; } public Guid VoterUserId { get; set; } public BoardVoteValue VoteValue { get; set; } public string? Note { get; set; } public DateTime CreatedAt { get; set; } }
public sealed class BoardVoteSummaryResponse { public Guid SeriesId { get; set; } public int Approve { get; set; } public int Reject { get; set; } public int Abstain { get; set; } public int Total { get; set; } }

public sealed class CreateIssueRequest { [Required] public string IssueNumber { get; set; } = string.Empty; [Required] public string Title { get; set; } = string.Empty; public DateTime ReleaseDate { get; set; } }
public sealed class IssueResponse { public Guid Id { get; set; } public string IssueNumber { get; set; } = string.Empty; public string Title { get; set; } = string.Empty; public DateTime ReleaseDate { get; set; } public IssueStatus Status { get; set; } public DateTime CreatedAt { get; set; } }
public sealed class UpdateIssueStatusRequest { public IssueStatus Status { get; set; } }

public sealed class CreatePublicationScheduleRequest { public Guid SeriesId { get; set; } public Guid ChapterId { get; set; } public Guid? IssueId { get; set; } public PublicationType PublicationType { get; set; } public DateTime ScheduledDate { get; set; } }
public sealed class PublicationScheduleResponse { public Guid Id { get; set; } public Guid SeriesId { get; set; } public Guid ChapterId { get; set; } public Guid? IssueId { get; set; } public PublicationType PublicationType { get; set; } public DateTime ScheduledDate { get; set; } public PublicationStatus Status { get; set; } public DateTime CreatedAt { get; set; } public DateTime? PublishedAt { get; set; } }

public sealed class ReaderVoteRequest { public Guid SeriesId { get; set; } [Range(0, int.MaxValue)] public int VoteCount { get; set; } }
public sealed class ReaderVoteResponse { public Guid Id { get; set; } public Guid IssueId { get; set; } public Guid SeriesId { get; set; } public int VoteCount { get; set; } public int? RankPosition { get; set; } public Guid ImportedByUserId { get; set; } public DateTime CreatedAt { get; set; } }
public sealed class RankingItemResponse { public Guid SeriesId { get; set; } public int VoteCount { get; set; } public int RankPosition { get; set; } public decimal Score { get; set; } }
public sealed class RankingSnapshotResponse { public Guid Id { get; set; } public Guid IssueId { get; set; } public DateTime GeneratedAt { get; set; } public Guid GeneratedByUserId { get; set; } public IReadOnlyCollection<RankingItemResponse> Items { get; set; } = Array.Empty<RankingItemResponse>(); }
public sealed class CancellationWarningResponse { public Guid Id { get; set; } public Guid SeriesId { get; set; } public string Reason { get; set; } = string.Empty; public CancellationRiskLevel RiskLevel { get; set; } public DateTime CreatedAt { get; set; } public bool IsResolved { get; set; } public DateTime? ResolvedAt { get; set; } }
