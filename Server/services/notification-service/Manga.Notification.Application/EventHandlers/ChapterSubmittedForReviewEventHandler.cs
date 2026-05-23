using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class ChapterSubmittedForReviewEventHandler : NotificationEventHandlerBase<ChapterSubmittedForReviewEvent>, IIntegrationEventHandler<ChapterSubmittedForReviewEvent>
{
    public ChapterSubmittedForReviewEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, ILogger<ChapterSubmittedForReviewEventHandler> logger)
        : base(repository, unitOfWork, logger)
    {
    }

    public Task HandleAsync(ChapterSubmittedForReviewEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, async ct =>
        {
            await CreateNotificationIfMissingAsync(
                eventMessage.SubmittedByUserId,
                "Chapter submitted for review",
                $"Chapter {eventMessage.ChapterId} has been submitted for editorial review.",
                NotificationType.ChapterSubmittedForReview,
                eventMessage.MessageId,
                ct);
        }, cancellationToken);
}
