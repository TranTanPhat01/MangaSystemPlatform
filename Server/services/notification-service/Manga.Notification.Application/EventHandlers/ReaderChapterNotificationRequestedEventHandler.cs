using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class ReaderChapterNotificationRequestedEventHandler : NotificationEventHandlerBase<ReaderChapterNotificationRequestedEvent>, IIntegrationEventHandler<ReaderChapterNotificationRequestedEvent>
{
    public ReaderChapterNotificationRequestedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, INotificationRealtimePublisher realtimePublisher, ILogger<ReaderChapterNotificationRequestedEventHandler> logger)
        : base(repository, unitOfWork, realtimePublisher, logger) { }

    public Task HandleAsync(ReaderChapterNotificationRequestedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct => CreateNotificationIfMissingAsync(
            eventMessage.UserId,
            "New chapter published",
            $"{eventMessage.Title} is now available to read.",
            NotificationType.ReaderChapterPublished,
            eventMessage.SourceEventId,
            ct), cancellationToken);
}
