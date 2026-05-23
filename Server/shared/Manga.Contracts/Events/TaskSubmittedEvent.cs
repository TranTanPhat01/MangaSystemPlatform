namespace Manga.Contracts.Events;

public sealed record TaskSubmittedEvent(
    Guid MessageId,
    Guid TaskId,
    Guid SubmittedByUserId,
    Guid? FileId,
    DateTime OccurredAt);
