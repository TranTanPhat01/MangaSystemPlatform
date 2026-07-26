using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class ProposalSubmittedEventHandler : NotificationEventHandlerBase<ProposalSubmittedEvent>, IIntegrationEventHandler<ProposalSubmittedEvent>
{
    public ProposalSubmittedEventHandler(
        INotificationRepository repository,
        INotificationUnitOfWork unitOfWork,
        INotificationRealtimePublisher realtimePublisher,
        ILogger<ProposalSubmittedEventHandler> logger)
        : base(repository, unitOfWork, realtimePublisher, logger)
    {
    }

    public Task HandleAsync(ProposalSubmittedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            return CreateNotificationIfMissingAsync(
                eventMessage.RecipientUserId,
                "New series proposal submitted",
                $"Series {eventMessage.SeriesId} has been submitted for board approval.",
                NotificationType.ProposalSubmitted,
                eventMessage.MessageId,
                ct,
                resourceType: "Series",
                resourceId: eventMessage.SeriesId,
                actionUrl: $"/board?tab=Proposals&seriesId={eventMessage.SeriesId}");
        }, cancellationToken);
}
