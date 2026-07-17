namespace Manga.Contracts.Events;

public sealed record SeriesProposalDecidedEvent(
    Guid MessageId,
    Guid SeriesId,
    Guid RequestedByUserId,
    string Decision,
    string Reason,
    DateTime OccurredAt);
