namespace Manga.Contracts.Events;

public sealed record CancellationWarningCreatedEvent(
    Guid SeriesId,
    string RiskLevel,
    string Reason,
    DateTime CreatedAt);
