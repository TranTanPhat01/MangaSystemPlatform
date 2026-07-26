using System;

namespace Manga.Contracts.Events;

public sealed record ProposalSubmittedEvent(
    Guid MessageId,
    Guid SeriesId,
    Guid SubmittedByUserId,
    Guid RecipientUserId,
    DateTime OccurredAt);
