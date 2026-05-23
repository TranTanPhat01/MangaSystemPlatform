namespace Manga.Contracts.Events;

public sealed record RankingCalculatedEvent(
    Guid MessageId,
    Guid IssueId,
    Guid RankingSnapshotId,
    DateTime OccurredAt);
