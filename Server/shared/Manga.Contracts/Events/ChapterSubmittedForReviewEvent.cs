namespace Manga.Contracts.Events;

public sealed record ChapterSubmittedForReviewEvent(
    Guid ChapterId,
    Guid SeriesId,
    Guid SubmittedByUserId,
    DateTime SubmittedAt);
