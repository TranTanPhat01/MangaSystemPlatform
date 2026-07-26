using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;

namespace Manga.Editorial.Application.Services;

public sealed class RankingService : IRankingService
{
    private readonly IEditorialRepository _repository; private readonly IEditorialUnitOfWork _unitOfWork; private readonly ICurrentUserService _currentUser;
    private readonly IEventBus _eventBus;
    private readonly IMangaLookupClient _manga;
    public RankingService(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork, ICurrentUserService currentUser, IEventBus eventBus, IMangaLookupClient manga) { _repository = repository; _unitOfWork = unitOfWork; _currentUser = currentUser; _eventBus = eventBus; _manga = manga; }
    public async Task<Result<ReaderVoteResponse>> AddReaderVoteAsync(Guid issueId, ReaderVoteRequest request, CancellationToken cancellationToken = default)
    {
        if (issueId == Guid.Empty) return Result<ReaderVoteResponse>.Failure("IssueId is required.");
        if (request.SeriesId == Guid.Empty) return Result<ReaderVoteResponse>.Failure("SeriesId is required.");
        if (request.VoteCount < 0) return Result<ReaderVoteResponse>.Failure("VoteCount cannot be negative.");
        
        var issue = await _repository.GetByIdAsync<Issue>(issueId, cancellationToken);
        if (issue is null) return Result<ReaderVoteResponse>.Failure("Issue not found.");
        if (issue.Status != IssueStatus.Released) return Result<ReaderVoteResponse>.Failure("Reader votes can only be entered for Released issues.");

        Guid readerId;
        if (CanManageBoard())
        {
            readerId = request.ReaderId ?? _currentUser.UserId;
        }
        else
        {
            readerId = _currentUser.UserId;
            if (request.ReaderId.HasValue && request.ReaderId.Value != _currentUser.UserId)
            {
                return Result<ReaderVoteResponse>.Failure("Readers cannot submit votes for another user.");
            }
        }
        if (readerId == Guid.Empty) return Result<ReaderVoteResponse>.Failure("ReaderId is required.");
        if (_currentUser.UserId == Guid.Empty) return Result<ReaderVoteResponse>.Failure("Current user is required.");

        var existingList = await _repository.ListAsync<ReaderVote>(vote => vote.IssueId == issueId && vote.SeriesId == request.SeriesId && vote.ReaderId == readerId, cancellationToken);
        if (existingList.Count > 0)
        {
            var existingVote = existingList[0];
            existingVote.VoteCount = request.VoteCount;
            existingVote.ImportedByUserId = _currentUser.UserId;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<ReaderVoteResponse>.Success(ToResponse(existingVote));
        }

        var vote = new ReaderVote { IssueId = issueId, SeriesId = request.SeriesId, ReaderId = readerId, VoteCount = request.VoteCount, ImportedByUserId = _currentUser.UserId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(vote, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ReaderVoteResponse>.Success(ToResponse(vote));
    }
    public async Task<Result<IReadOnlyList<ReaderVoteResponse>>> GetReaderVotesAsync(Guid issueId, CancellationToken cancellationToken = default) => Result<IReadOnlyList<ReaderVoteResponse>>.Success((await _repository.ListAsync<ReaderVote>(v => v.IssueId == issueId, cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<RankingSnapshotResponse>> CalculateRankingAsync(Guid issueId, CancellationToken cancellationToken = default)
    {
        if (!CanManageBoard()) return Result<RankingSnapshotResponse>.Failure("Only Editorial Board members can calculate rankings.");
        
        var allVotes = await _repository.ListAsync<ReaderVote>(v => v.IssueId == issueId, cancellationToken);
        
        var seriesVotes = allVotes
            .GroupBy(v => v.SeriesId)
            .Select(g => new
            {
                SeriesId = g.Key,
                VoteCount = g.Select(v => v.ReaderId).Distinct().Count()
            })
            .OrderByDescending(x => x.VoteCount)
            .ThenBy(x => x.SeriesId)
            .ToArray();

        var snapshot = new RankingSnapshot { IssueId = issueId, GeneratedAt = DateTime.UtcNow, GeneratedByUserId = _currentUser.UserId };
        var total = seriesVotes.Length;
        for (var i = 0; i < seriesVotes.Length; i++)
        {
            var sv = seriesVotes[i];
            var rank = i + 1;
            
            var votesForSeries = allVotes.Where(v => v.SeriesId == sv.SeriesId);
            foreach (var v in votesForSeries)
            {
                v.RankPosition = rank;
            }

            var item = new RankingItem 
            { 
                RankingSnapshotId = snapshot.Id, 
                SeriesId = sv.SeriesId, 
                VoteCount = sv.VoteCount, 
                RankPosition = rank, 
                Score = sv.VoteCount 
            };
            snapshot.Items.Add(item);
            
            if (i >= Math.Max(0, total - 3) || rank >= 10) 
                await CreateWarningIfMissingAsync(sv.SeriesId, rank, cancellationToken);
        }
        await _repository.AddAsync(snapshot, cancellationToken);
        await _eventBus.PublishAsync(new RankingCalculatedEvent(Guid.NewGuid(), issueId, snapshot.Id, snapshot.GeneratedByUserId, snapshot.GeneratedAt), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<RankingSnapshotResponse>.Success(await ToResponseAsync(snapshot, cancellationToken));
    }
    public async Task<Result<IReadOnlyList<RankingSnapshotResponse>>> GetRankingsAsync(Guid issueId, CancellationToken cancellationToken = default) { var snapshots = (await _repository.ListAsync<RankingSnapshot>(s => s.IssueId == issueId, cancellationToken)).OrderByDescending(snapshot => snapshot.GeneratedAt); var responses = new List<RankingSnapshotResponse>(); foreach (var snapshot in snapshots) responses.Add(await ToResponseAsync(snapshot, cancellationToken)); return Result<IReadOnlyList<RankingSnapshotResponse>>.Success(responses); }
    public async Task<Result<IReadOnlyList<RankingItemResponse>>> GetSeriesRankingHistoryAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        var snapshots = await _repository.ListAsync<RankingSnapshot>(cancellationToken: cancellationToken);
        var history = snapshots.OrderByDescending(snapshot => snapshot.GeneratedAt).SelectMany(snapshot => snapshot.Items.Where(item => item.SeriesId == seriesId).Select(item =>
        {
            var response = ToResponse(item, null, Math.Max(1, snapshot.Items.Sum(other => other.VoteCount)));
            response.SnapshotGeneratedAt = snapshot.GeneratedAt;
            return response;
        })).ToArray();
        return Result<IReadOnlyList<RankingItemResponse>>.Success(history);
    }
    public async Task<Result<IReadOnlyList<CancellationWarningResponse>>> GetCancellationWarningsAsync(Guid seriesId, CancellationToken cancellationToken = default) => Result<IReadOnlyList<CancellationWarningResponse>>.Success((await _repository.ListAsync<CancellationWarning>(w => w.SeriesId == seriesId, cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<IReadOnlyList<CancellationWarningResponse>>> GetAllCancellationWarningsAsync(CancellationToken cancellationToken = default) => Result<IReadOnlyList<CancellationWarningResponse>>.Success((await _repository.ListAsync<CancellationWarning>(w => !w.IsResolved, cancellationToken)).Select(ToResponse).OrderByDescending(w => w.RiskLevel).ThenBy(w => w.CreatedAt).ToArray());
    private async Task CreateWarningIfMissingAsync(Guid seriesId, int rank, CancellationToken cancellationToken)
    {
        var series = await _manga.GetSeriesByIdAsync(seriesId, cancellationToken);
        if (series is null || series.Status == "Cancelled") return;

        var active = await _repository.ListAsync<CancellationWarning>(w => w.SeriesId == seriesId && !w.IsResolved, cancellationToken);
        if (active.Count == 0)
        {
            var warning = new CancellationWarning { SeriesId = seriesId, Reason = $"Series ranked low at position {rank}.", RiskLevel = rank >= 10 ? CancellationRiskLevel.High : CancellationRiskLevel.Medium, CreatedAt = DateTime.UtcNow };
            await _repository.AddAsync(warning, cancellationToken);
            await _eventBus.PublishAsync(new CancellationWarningCreatedEvent(Guid.NewGuid(), warning.SeriesId, series.AuthorUserId, warning.RiskLevel.ToString(), warning.Reason, warning.CreatedAt), cancellationToken);
        }
    }
    private static ReaderVoteResponse ToResponse(ReaderVote v) => new() { Id = v.Id, IssueId = v.IssueId, SeriesId = v.SeriesId, ReaderId = v.ReaderId, VoteCount = v.VoteCount, RankPosition = v.RankPosition, ImportedByUserId = v.ImportedByUserId, CreatedAt = v.CreatedAt };
    private async Task<RankingSnapshotResponse> ToResponseAsync(RankingSnapshot s, CancellationToken cancellationToken)
    {
        var prior = (await _repository.ListAsync<RankingSnapshot>(snapshot => snapshot.GeneratedAt < s.GeneratedAt, cancellationToken)).OrderByDescending(snapshot => snapshot.GeneratedAt).FirstOrDefault();
        var priorItems = prior is null ? Array.Empty<RankingItem>() : (await _repository.ListAsync<RankingItem>(item => item.RankingSnapshotId == prior.Id, cancellationToken)).ToArray();
        var totalVotes = Math.Max(1, s.Items.Sum(item => item.VoteCount));
        return new RankingSnapshotResponse { Id = s.Id, IssueId = s.IssueId, GeneratedAt = s.GeneratedAt, GeneratedByUserId = s.GeneratedByUserId, Items = s.Items.Select(item => ToResponse(item, priorItems.FirstOrDefault(previous => previous.SeriesId == item.SeriesId)?.RankPosition, totalVotes)).ToArray() };
    }
    private static RankingItemResponse ToResponse(RankingItem i) => ToResponse(i, null, Math.Max(1, i.VoteCount));
    private static RankingItemResponse ToResponse(RankingItem i, int? previousRank, int totalVotes) => new() { SeriesId = i.SeriesId, VoteCount = i.VoteCount, RankPosition = i.RankPosition, PreviousRank = previousRank, PositiveRate = Math.Round(i.VoteCount * 100m / totalVotes, 2), Trend = previousRank is null ? "New" : i.RankPosition < previousRank ? "Up" : i.RankPosition > previousRank ? "Down" : "Stable", RiskLevel = i.RankPosition >= 10 ? "High" : i.RankPosition >= 5 ? "Medium" : "Low", Score = i.Score };
    private static CancellationWarningResponse ToResponse(CancellationWarning w) => new() { Id = w.Id, SeriesId = w.SeriesId, Reason = w.Reason, RiskLevel = w.RiskLevel, CreatedAt = w.CreatedAt, IsResolved = w.IsResolved, ResolvedAt = w.ResolvedAt };
    private bool CanManageBoard() => _currentUser.IsInRole("EditorialBoard") || _currentUser.IsInRole("Admin");
}
