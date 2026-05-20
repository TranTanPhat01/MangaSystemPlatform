namespace Manga.Contracts.Events;

public sealed record TaskSubmittedEvent(
    Guid TaskId,
    Guid SubmittedByUserId,
    Guid? FileId,
    DateTime SubmittedAt);
