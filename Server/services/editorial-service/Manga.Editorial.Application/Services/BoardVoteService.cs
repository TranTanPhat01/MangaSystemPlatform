using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Application.Services;

public sealed class BoardVoteService : IBoardVoteService
{
    private readonly IEditorialRepository _repository; private readonly IEditorialUnitOfWork _unitOfWork; private readonly ICurrentUserService _currentUser;
    public BoardVoteService(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork, ICurrentUserService currentUser) { _repository = repository; _unitOfWork = unitOfWork; _currentUser = currentUser; }
    public async Task<Result<BoardVoteResponse>> VoteAsync(Guid seriesId, BoardVoteRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.ListAsync<BoardVote>(v => v.SeriesId == seriesId && v.ProposalId == request.ProposalId && v.VoterUserId == _currentUser.UserId, cancellationToken);
        if (existing.Count > 0) return Result<BoardVoteResponse>.Failure("User already voted for this proposal context.");
        var vote = new BoardVote { SeriesId = seriesId, ProposalId = request.ProposalId, VoterUserId = _currentUser.UserId, VoteValue = request.VoteValue, Note = request.Note, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(vote, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<BoardVoteResponse>.Success(ToResponse(vote));
    }
    public async Task<Result<IReadOnlyList<BoardVoteResponse>>> GetVotesAsync(Guid seriesId, CancellationToken cancellationToken = default) => Result<IReadOnlyList<BoardVoteResponse>>.Success((await _repository.ListAsync<BoardVote>(v => v.SeriesId == seriesId, cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<BoardVoteSummaryResponse>> GetSummaryAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        var votes = await _repository.ListAsync<BoardVote>(v => v.SeriesId == seriesId, cancellationToken);
        return Result<BoardVoteSummaryResponse>.Success(new BoardVoteSummaryResponse { SeriesId = seriesId, Approve = votes.Count(v => v.VoteValue == BoardVoteValue.Approve), Reject = votes.Count(v => v.VoteValue == BoardVoteValue.Reject), Abstain = votes.Count(v => v.VoteValue == BoardVoteValue.Abstain), Total = votes.Count });
    }
    private static BoardVoteResponse ToResponse(BoardVote v) => new() { Id = v.Id, SeriesId = v.SeriesId, ProposalId = v.ProposalId, VoterUserId = v.VoterUserId, VoteValue = v.VoteValue, Note = v.Note, CreatedAt = v.CreatedAt };
}
