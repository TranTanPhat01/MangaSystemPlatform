using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class ChapterApprovedEventHandler : NotificationEventHandlerBase<ChapterApprovedEvent>, IIntegrationEventHandler<ChapterApprovedEvent>
{
    public ChapterApprovedEventHandler(
        INotificationRepository repository,
        INotificationUnitOfWork unitOfWork,
        INotificationRealtimePublisher realtimePublisher,
        ILogger<ChapterApprovedEventHandler> logger)
        : base(repository, unitOfWork, realtimePublisher, logger)
    {
    }

    public Task HandleAsync(ChapterApprovedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            return CreateNotificationIfMissingAsync(
                eventMessage.RequestedByUserId,
                "Chapter approved",
                $"Chapter {eventMessage.ChapterId} has been approved by editorial.",
                NotificationType.ChapterApproved,
                eventMessage.MessageId,
                ct);
        }, cancellationToken);
}
