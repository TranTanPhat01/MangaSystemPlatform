namespace Manga.Contracts.Events;

public sealed record ChapterSubmittedForReviewEvent(
    Guid MessageId,
    Guid ChapterId,
    Guid SeriesId,
    Guid SubmittedByUserId,
    DateTime OccurredAt);
