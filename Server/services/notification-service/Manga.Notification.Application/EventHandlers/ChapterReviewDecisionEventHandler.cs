using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class ChapterReviewDecisionEventHandler : NotificationEventHandlerBase<ChapterReviewDecisionEvent>, IIntegrationEventHandler<ChapterReviewDecisionEvent>
{
    public ChapterReviewDecisionEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, INotificationRealtimePublisher realtimePublisher, ILogger<ChapterReviewDecisionEventHandler> logger)
        : base(repository, unitOfWork, realtimePublisher, logger)
    {
    }

    public Task HandleAsync(ChapterReviewDecisionEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            var isRevision = string.Equals(eventMessage.Decision, "RevisionRequested", StringComparison.Ordinal);
            return CreateNotificationIfMissingAsync(
                eventMessage.RequestedByUserId,
                isRevision ? "Chapter revision requested" : "Chapter rejected",
                $"Chapter {eventMessage.ChapterId}: {eventMessage.Reason}",
                isRevision ? NotificationType.ChapterRevisionRequested : NotificationType.ChapterRejected,
                eventMessage.MessageId,
                ct,
                resourceType: "Chapter",
                resourceId: eventMessage.ChapterId,
                actionUrl: isRevision ? $"/series/{eventMessage.SeriesId}/chapters/{eventMessage.ChapterId}" : $"/series/{eventMessage.SeriesId}");
        }, cancellationToken);
}
