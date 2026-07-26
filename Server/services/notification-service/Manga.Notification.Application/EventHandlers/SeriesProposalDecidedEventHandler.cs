using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class SeriesProposalDecidedEventHandler : NotificationEventHandlerBase<SeriesProposalDecidedEvent>, IIntegrationEventHandler<SeriesProposalDecidedEvent>
{
    public SeriesProposalDecidedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, INotificationRealtimePublisher realtimePublisher, ILogger<SeriesProposalDecidedEventHandler> logger) : base(repository, unitOfWork, realtimePublisher, logger) { }
    public Task HandleAsync(SeriesProposalDecidedEvent eventMessage, CancellationToken cancellationToken = default) => 
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct => 
        {
            var isApproved = string.Equals(eventMessage.Decision, "Approved", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(eventMessage.Decision, "Approve", StringComparison.OrdinalIgnoreCase);
            var type = isApproved ? NotificationType.ProposalApproved : NotificationType.ProposalRejected;

            return CreateNotificationIfMissingAsync(
                eventMessage.RequestedByUserId, 
                isApproved ? "Series proposal approved" : "Series proposal rejected", 
                $"Series {eventMessage.SeriesId}: {eventMessage.Decision}. {eventMessage.Reason}", 
                type, 
                eventMessage.MessageId, 
                ct,
                resourceType: "Series",
                resourceId: eventMessage.SeriesId,
                actionUrl: $"/series/{eventMessage.SeriesId}");
        }, cancellationToken);
}
