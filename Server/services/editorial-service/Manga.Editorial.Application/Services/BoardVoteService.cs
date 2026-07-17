using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;

namespace Manga.Editorial.Application.Services;

public sealed class BoardVoteService : IBoardVoteService
{
    private const int Quorum = 3;
    private readonly IEditorialRepository _repository; private readonly IEditorialUnitOfWork _unitOfWork; private readonly ICurrentUserService _currentUser; private readonly IMangaLookupClient _manga; private readonly IEventBus _eventBus;
    public BoardVoteService(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork, ICurrentUserService currentUser, IMangaLookupClient manga, IEventBus eventBus) { _repository = repository; _unitOfWork = unitOfWork; _currentUser = currentUser; _manga = manga; _eventBus = eventBus; }

    public async Task<Result<BoardVoteResponse>> VoteAsync(Guid seriesId, BoardVoteRequest request, CancellationToken cancellationToken = default)
    {
        if (!CanVote()) return Result<BoardVoteResponse>.Failure("Only Editorial Board members can vote.");
        if (request.VoteValue == BoardVoteValue.Abstain) return Result<BoardVoteResponse>.Failure("Abstain is not supported for proposal decisions.");
        if (request.VoteValue is BoardVoteValue.Reject or BoardVoteValue.RequestRevision && string.IsNullOrWhiteSpace(request.Note)) return Result<BoardVoteResponse>.Failure("A reason is required for reject or revision votes.");
        var existing = await _repository.ListAsync<BoardVote>(v => v.SeriesId == seriesId && v.ProposalId == request.ProposalId && v.VoterUserId == _currentUser.UserId, cancellationToken);
        if (existing.Count > 0) return Result<BoardVoteResponse>.Failure("User already voted for this proposal context.");
        var vote = new BoardVote { SeriesId = seriesId, ProposalId = request.ProposalId, VoterUserId = _currentUser.UserId, VoteValue = request.VoteValue, Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(), CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(vote, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<BoardVoteResponse>.Success(ToResponse(vote));
    }

    public async Task<Result<IReadOnlyList<BoardVoteResponse>>> GetVotesAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        if (!CanVote()) return Result<IReadOnlyList<BoardVoteResponse>>.Failure("Only Editorial Board members can view votes.");
        return Result<IReadOnlyList<BoardVoteResponse>>.Success((await _repository.ListAsync<BoardVote>(v => v.SeriesId == seriesId, cancellationToken)).Select(ToResponse).ToArray());
    }

    public async Task<Result<BoardVoteSummaryResponse>> GetSummaryAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        if (!CanVote()) return Result<BoardVoteSummaryResponse>.Failure("Only Editorial Board members can view vote summaries.");
        return Result<BoardVoteSummaryResponse>.Success(CreateSummary(seriesId, await _repository.ListAsync<BoardVote>(v => v.SeriesId == seriesId, cancellationToken)));
    }

    public async Task<Result<BoardVoteSummaryResponse>> FinalizeProposalAsync(Guid seriesId, FinalizeProposalRequest request, CancellationToken cancellationToken = default)
    {
        if (!CanVote()) return Result<BoardVoteSummaryResponse>.Failure("Only Editorial Board members can finalize proposals.");
        var summary = CreateSummary(seriesId, await _repository.ListAsync<BoardVote>(v => v.SeriesId == seriesId, cancellationToken));
        var isAdminOverride = _currentUser.IsInRole("Admin") && request.AdminOverride;
        if (!summary.QuorumReached && !isAdminOverride) return Result<BoardVoteSummaryResponse>.Failure("Proposal quorum has not been reached.");
        if (isAdminOverride && string.IsNullOrWhiteSpace(request.Reason)) return Result<BoardVoteSummaryResponse>.Failure("Admin override requires a reason.");
        if (summary.FinalRecommendation == "Pending" && !isAdminOverride) return Result<BoardVoteSummaryResponse>.Failure("Proposal has no final recommendation.");
        var decision = summary.FinalRecommendation == "Pending" ? "RequestRevision" : summary.FinalRecommendation;
        var reason = request.Reason ?? $"Board recommendation: {decision}";
        if (!await _manga.ApplyProposalDecisionAsync(seriesId, decision, reason, cancellationToken)) return Result<BoardVoteSummaryResponse>.Failure("Proposal decision could not be applied.");
        var series = await _manga.GetSeriesByIdAsync(seriesId, cancellationToken);
        if (series is not null)
        {
            await _eventBus.PublishAsync(new SeriesProposalDecidedEvent(Guid.NewGuid(), seriesId, series.AuthorUserId, decision, reason, DateTime.UtcNow), cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        return Result<BoardVoteSummaryResponse>.Success(summary);
    }

    private static BoardVoteSummaryResponse CreateSummary(Guid seriesId, IReadOnlyList<BoardVote> votes)
    {
        var approve = votes.Count(v => v.VoteValue == BoardVoteValue.Approve); var reject = votes.Count(v => v.VoteValue == BoardVoteValue.Reject); var revision = votes.Count(v => v.VoteValue == BoardVoteValue.RequestRevision);
        var recommendation = approve >= Quorum || (votes.Count >= Quorum && approve > reject && approve > revision) ? "Approve" : reject >= Quorum || (votes.Count >= Quorum && reject > approve && reject > revision) ? "Reject" : revision >= Quorum || (votes.Count >= Quorum && revision > approve && revision > reject) ? "RequestRevision" : "Pending";
        return new BoardVoteSummaryResponse { SeriesId = seriesId, Approve = approve, Reject = reject, Revision = revision, Abstain = votes.Count(v => v.VoteValue == BoardVoteValue.Abstain), Total = votes.Count, QuorumReached = votes.Count >= Quorum, FinalRecommendation = recommendation };
    }
    private bool CanVote() => _currentUser.IsInRole("EditorialBoard") || _currentUser.IsInRole("Admin");
    private static BoardVoteResponse ToResponse(BoardVote v) => new() { Id = v.Id, SeriesId = v.SeriesId, ProposalId = v.ProposalId, VoterUserId = v.VoterUserId, VoteValue = v.VoteValue, Note = v.Note, CreatedAt = v.CreatedAt };
}
