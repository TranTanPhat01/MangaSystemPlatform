namespace Manga.Contracts.Events;

public sealed record ReaderChapterNotificationRequestedEvent(
    Guid MessageId,
    Guid SourceEventId,
    Guid UserId,
    Guid ChapterId,
    Guid SeriesId,
    string Title,
    DateTime PublishedAtUtc);
