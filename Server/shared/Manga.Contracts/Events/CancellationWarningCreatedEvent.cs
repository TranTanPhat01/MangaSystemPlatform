namespace Manga.Contracts.Events;

public sealed record CancellationWarningCreatedEvent(
    Guid MessageId,
    Guid SeriesId,
    Guid AuthorUserId,
    string RiskLevel,
    string Reason,
    DateTime OccurredAt);
