using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class CancellationWarningCreatedEventHandler : NotificationEventHandlerBase<CancellationWarningCreatedEvent>, IIntegrationEventHandler<CancellationWarningCreatedEvent>
{
    public CancellationWarningCreatedEventHandler(
        INotificationRepository repository,
        INotificationUnitOfWork unitOfWork,
        INotificationRealtimePublisher realtimePublisher,
        ILogger<CancellationWarningCreatedEventHandler> logger)
        : base(repository, unitOfWork, realtimePublisher, logger)
    {
    }

    public Task HandleAsync(CancellationWarningCreatedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            return CreateNotificationIfMissingAsync(
                eventMessage.AuthorUserId,
                "Cancellation warning",
                $"Your series warning: {eventMessage.Reason} Risk Level: {eventMessage.RiskLevel}",
                NotificationType.CancellationWarning,
                eventMessage.MessageId,
                ct,
                resourceType: "Series",
                resourceId: eventMessage.SeriesId,
                actionUrl: $"/series/{eventMessage.SeriesId}");
        }, cancellationToken);
}
