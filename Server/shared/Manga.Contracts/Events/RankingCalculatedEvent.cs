namespace Manga.Contracts.Events;

public sealed record RankingCalculatedEvent(
    Guid IssueId,
    Guid RankingSnapshotId,
    DateTime GeneratedAt);
