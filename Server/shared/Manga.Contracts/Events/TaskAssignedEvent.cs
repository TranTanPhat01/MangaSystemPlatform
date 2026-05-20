namespace Manga.Contracts.Events;

public sealed record TaskAssignedEvent(
    Guid MessageId,
    Guid TaskId,
    Guid PageId,
    Guid AssignedToUserId,
    Guid AssignedByUserId,
    DateTime OccurredAt);
