using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class ChapterApprovedEventHandler : NotificationEventHandlerBase<ChapterApprovedEvent>, IIntegrationEventHandler<ChapterApprovedEvent>
{
    public ChapterApprovedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, ILogger<ChapterApprovedEventHandler> logger)
        : base(repository, unitOfWork, logger)
    {
    }

    public Task HandleAsync(ChapterApprovedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            LogOnly("ChapterApprovedEvent received for chapter {ChapterId}. No related notification target is available in this event.", eventMessage.ChapterId);
            return Task.CompletedTask;
        }, cancellationToken);
}
