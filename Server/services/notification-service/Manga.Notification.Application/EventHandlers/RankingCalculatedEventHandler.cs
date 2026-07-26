using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class RankingCalculatedEventHandler : NotificationEventHandlerBase<RankingCalculatedEvent>, IIntegrationEventHandler<RankingCalculatedEvent>
{
    public RankingCalculatedEventHandler(
        INotificationRepository repository,
        INotificationUnitOfWork unitOfWork,
        INotificationRealtimePublisher realtimePublisher,
        ILogger<RankingCalculatedEventHandler> logger)
        : base(repository, unitOfWork, realtimePublisher, logger)
    {
    }

    public Task HandleAsync(RankingCalculatedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            return CreateNotificationIfMissingAsync(
                eventMessage.GeneratedByUserId,
                "Ranking calculated",
                $"Ranking calculation completed for issue.",
                NotificationType.RankingCalculated,
                eventMessage.MessageId,
                ct,
                resourceType: "Issue",
                resourceId: eventMessage.IssueId,
                actionUrl: $"/board?tab=Rankings&issueId={eventMessage.IssueId}");
        }, cancellationToken);
}
