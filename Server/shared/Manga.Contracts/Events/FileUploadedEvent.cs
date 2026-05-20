namespace Manga.Contracts.Events;

public sealed record FileUploadedEvent(
    Guid FileId,
    Guid UploadedByUserId,
    string FileCategory,
    string OriginalFileName,
    DateTime CreatedAt);
