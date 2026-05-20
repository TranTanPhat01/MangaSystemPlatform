namespace Manga.Contracts.Events;

public sealed record TaskAssignedEvent(
    Guid TaskId,
    Guid PageId,
    Guid AssignedToUserId,
    Guid AssignedByUserId,
    DateTime CreatedAt);
