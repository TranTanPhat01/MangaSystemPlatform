namespace Manga.Contracts.Events;

public sealed record ChapterPublishedEvent(
    Guid EventId,
    Guid ChapterId,
    Guid SeriesId,
    string Title,
    DateTime PublishedAtUtc);
