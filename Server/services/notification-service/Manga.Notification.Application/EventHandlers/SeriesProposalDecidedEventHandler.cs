using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class SeriesProposalDecidedEventHandler : NotificationEventHandlerBase<SeriesProposalDecidedEvent>, IIntegrationEventHandler<SeriesProposalDecidedEvent>
{
    public SeriesProposalDecidedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, INotificationRealtimePublisher realtimePublisher, ILogger<SeriesProposalDecidedEventHandler> logger) : base(repository, unitOfWork, realtimePublisher, logger) { }
    public Task HandleAsync(SeriesProposalDecidedEvent eventMessage, CancellationToken cancellationToken = default) => HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct => CreateNotificationIfMissingAsync(eventMessage.RequestedByUserId, "Series proposal decided", $"Series {eventMessage.SeriesId}: {eventMessage.Decision}. {eventMessage.Reason}", NotificationType.System, eventMessage.MessageId, ct), cancellationToken);
}
