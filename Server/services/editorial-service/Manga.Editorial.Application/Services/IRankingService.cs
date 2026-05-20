using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;

namespace Manga.Editorial.Application.Services;

public interface IRankingService
{
    Task<Result<ReaderVoteResponse>> AddReaderVoteAsync(Guid issueId, ReaderVoteRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<ReaderVoteResponse>>> GetReaderVotesAsync(Guid issueId, CancellationToken cancellationToken = default);
    Task<Result<RankingSnapshotResponse>> CalculateRankingAsync(Guid issueId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<RankingSnapshotResponse>>> GetRankingsAsync(Guid issueId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<RankingItemResponse>>> GetSeriesRankingHistoryAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<CancellationWarningResponse>>> GetCancellationWarningsAsync(Guid seriesId, CancellationToken cancellationToken = default);
}
