namespace Manga.Contracts.Events;

public sealed record TaskApprovedEvent(
    Guid MessageId,
    Guid TaskId,
    Guid ApprovedByUserId,
    DateTime OccurredAt);
