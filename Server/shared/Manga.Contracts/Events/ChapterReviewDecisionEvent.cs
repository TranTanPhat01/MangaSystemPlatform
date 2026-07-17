namespace Manga.Contracts.Events;

public sealed record ChapterReviewDecisionEvent(
    Guid MessageId,
    Guid ChapterId,
    Guid SeriesId,
    Guid RequestedByUserId,
    Guid ReviewedByUserId,
    string Decision,
    string Reason,
    DateTime OccurredAt);
