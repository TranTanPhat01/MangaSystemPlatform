using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;

namespace Manga.Editorial.Application.Services;

public interface IBoardVoteService
{
    Task<Result<BoardVoteResponse>> VoteAsync(Guid seriesId, BoardVoteRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<BoardVoteResponse>>> GetVotesAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<Result<BoardVoteSummaryResponse>> GetSummaryAsync(Guid seriesId, CancellationToken cancellationToken = default);
}
