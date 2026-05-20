namespace Manga.Contracts.Events;

public sealed record CancellationWarningCreatedEvent(
    Guid MessageId,
    Guid SeriesId,
    string RiskLevel,
    string Reason,
    DateTime OccurredAt);
