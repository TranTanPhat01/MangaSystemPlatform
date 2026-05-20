namespace Manga.Contracts.Events;

public sealed record TaskApprovedEvent(
    Guid TaskId,
    Guid ApprovedByUserId,
    DateTime ApprovedAt);
