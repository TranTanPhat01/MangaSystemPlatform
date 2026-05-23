using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class RankingCalculatedEventHandler : NotificationEventHandlerBase<RankingCalculatedEvent>, IIntegrationEventHandler<RankingCalculatedEvent>
{
    public RankingCalculatedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, ILogger<RankingCalculatedEventHandler> logger)
        : base(repository, unitOfWork, logger)
    {
    }

    public Task HandleAsync(RankingCalculatedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            LogOnly("RankingCalculatedEvent received for issue {IssueId}. No target user is available.", eventMessage.IssueId);
            return Task.CompletedTask;
        }, cancellationToken);
}
