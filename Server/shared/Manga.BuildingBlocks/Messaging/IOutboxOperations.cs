namespace Manga.BuildingBlocks.Messaging;

public interface IOutboxOperations
{
    Task<IReadOnlyList<OutboxMessage>> ListAsync(OutboxMessageStatus? status, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<OutboxMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> RetryAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> RetryFailedAsync(CancellationToken cancellationToken = default);
    Task<OutboxSummary> GetSummaryAsync(CancellationToken cancellationToken = default);
}

public sealed record OutboxSummary(int Pending, int Failed, int PublishedLast24h, DateTime? LastFailedAt);
