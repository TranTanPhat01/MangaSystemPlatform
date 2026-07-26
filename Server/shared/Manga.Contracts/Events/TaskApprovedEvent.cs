namespace Manga.Contracts.Events;

public sealed record TaskApprovedEvent(
    Guid MessageId,
    Guid TaskId,
    Guid ApprovedByUserId,
    Guid ApprovedSubmissionId,
    DateTime OccurredAt);
