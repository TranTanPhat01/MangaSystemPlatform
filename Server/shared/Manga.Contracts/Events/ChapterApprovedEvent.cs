namespace Manga.Contracts.Events;

public sealed record ChapterApprovedEvent(
    Guid ChapterId,
    Guid SeriesId,
    Guid ApprovedByUserId,
    DateTime ApprovedAt);
