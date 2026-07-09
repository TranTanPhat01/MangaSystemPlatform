using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
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
            LogOnly("CancellationWarningCreatedEvent received for series {SeriesId} with risk {RiskLevel}. No target user is available.", eventMessage.SeriesId, eventMessage.RiskLevel);
            return Task.CompletedTask;
        }, cancellationToken);
}
