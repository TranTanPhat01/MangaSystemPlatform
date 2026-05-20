using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Application.Services;

public sealed class RankingService : IRankingService
{
    private readonly IEditorialRepository _repository; private readonly IEditorialUnitOfWork _unitOfWork; private readonly ICurrentUserService _currentUser;
    public RankingService(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork, ICurrentUserService currentUser) { _repository = repository; _unitOfWork = unitOfWork; _currentUser = currentUser; }
    public async Task<Result<ReaderVoteResponse>> AddReaderVoteAsync(Guid issueId, ReaderVoteRequest request, CancellationToken cancellationToken = default)
    {
        if (request.VoteCount < 0) return Result<ReaderVoteResponse>.Failure("VoteCount cannot be negative.");
        var vote = new ReaderVote { IssueId = issueId, SeriesId = request.SeriesId, VoteCount = request.VoteCount, ImportedByUserId = _currentUser.UserId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(vote, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken); return Result<ReaderVoteResponse>.Success(ToResponse(vote));
    }
    public async Task<Result<IReadOnlyList<ReaderVoteResponse>>> GetReaderVotesAsync(Guid issueId, CancellationToken cancellationToken = default) => Result<IReadOnlyList<ReaderVoteResponse>>.Success((await _repository.ListAsync<ReaderVote>(v => v.IssueId == issueId, cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<RankingSnapshotResponse>> CalculateRankingAsync(Guid issueId, CancellationToken cancellationToken = default)
    {
        var votes = (await _repository.ListAsync<ReaderVote>(v => v.IssueId == issueId, cancellationToken)).OrderByDescending(v => v.VoteCount).ToArray();
        var snapshot = new RankingSnapshot { IssueId = issueId, GeneratedAt = DateTime.UtcNow, GeneratedByUserId = _currentUser.UserId };
        var total = votes.Length;
        for (var i = 0; i < votes.Length; i++)
        {
            votes[i].RankPosition = i + 1;
            var item = new RankingItem { RankingSnapshotId = snapshot.Id, SeriesId = votes[i].SeriesId, VoteCount = votes[i].VoteCount, RankPosition = i + 1, Score = votes[i].VoteCount };
            snapshot.Items.Add(item);
            if (i >= Math.Max(0, total - 3) || i + 1 >= 10) await CreateWarningIfMissingAsync(votes[i].SeriesId, i + 1, cancellationToken);
        }
        await _repository.AddAsync(snapshot, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken); return Result<RankingSnapshotResponse>.Success(ToResponse(snapshot));
    }
    public async Task<Result<IReadOnlyList<RankingSnapshotResponse>>> GetRankingsAsync(Guid issueId, CancellationToken cancellationToken = default) => Result<IReadOnlyList<RankingSnapshotResponse>>.Success((await _repository.ListAsync<RankingSnapshot>(s => s.IssueId == issueId, cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<IReadOnlyList<RankingItemResponse>>> GetSeriesRankingHistoryAsync(Guid seriesId, CancellationToken cancellationToken = default) => Result<IReadOnlyList<RankingItemResponse>>.Success((await _repository.ListAsync<RankingItem>(i => i.SeriesId == seriesId, cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<IReadOnlyList<CancellationWarningResponse>>> GetCancellationWarningsAsync(Guid seriesId, CancellationToken cancellationToken = default) => Result<IReadOnlyList<CancellationWarningResponse>>.Success((await _repository.ListAsync<CancellationWarning>(w => w.SeriesId == seriesId, cancellationToken)).Select(ToResponse).ToArray());
    private async Task CreateWarningIfMissingAsync(Guid seriesId, int rank, CancellationToken cancellationToken) { var active = await _repository.ListAsync<CancellationWarning>(w => w.SeriesId == seriesId && !w.IsResolved, cancellationToken); if (active.Count == 0) await _repository.AddAsync(new CancellationWarning { SeriesId = seriesId, Reason = $"Series ranked low at position {rank}.", RiskLevel = rank >= 10 ? CancellationRiskLevel.High : CancellationRiskLevel.Medium, CreatedAt = DateTime.UtcNow }, cancellationToken); }
    private static ReaderVoteResponse ToResponse(ReaderVote v) => new() { Id = v.Id, IssueId = v.IssueId, SeriesId = v.SeriesId, VoteCount = v.VoteCount, RankPosition = v.RankPosition, ImportedByUserId = v.ImportedByUserId, CreatedAt = v.CreatedAt };
    private static RankingSnapshotResponse ToResponse(RankingSnapshot s) => new() { Id = s.Id, IssueId = s.IssueId, GeneratedAt = s.GeneratedAt, GeneratedByUserId = s.GeneratedByUserId, Items = s.Items.Select(ToResponse).ToArray() };
    private static RankingItemResponse ToResponse(RankingItem i) => new() { SeriesId = i.SeriesId, VoteCount = i.VoteCount, RankPosition = i.RankPosition, Score = i.Score };
    private static CancellationWarningResponse ToResponse(CancellationWarning w) => new() { Id = w.Id, SeriesId = w.SeriesId, Reason = w.Reason, RiskLevel = w.RiskLevel, CreatedAt = w.CreatedAt, IsResolved = w.IsResolved, ResolvedAt = w.ResolvedAt };
}
