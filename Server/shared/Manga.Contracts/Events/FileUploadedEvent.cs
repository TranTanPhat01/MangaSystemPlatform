namespace Manga.Contracts.Events;

public sealed record FileUploadedEvent(
    Guid MessageId,
    Guid FileId,
    Guid UploadedByUserId,
    string FileCategory,
    string OriginalFileName,
    DateTime OccurredAt);
