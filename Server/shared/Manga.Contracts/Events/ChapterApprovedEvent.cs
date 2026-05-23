namespace Manga.Contracts.Events;

public sealed record ChapterApprovedEvent(
    Guid MessageId,
    Guid ChapterId,
    Guid SeriesId,
    Guid ApprovedByUserId,
    DateTime OccurredAt);
