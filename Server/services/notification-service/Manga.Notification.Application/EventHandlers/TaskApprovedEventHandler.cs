using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class TaskApprovedEventHandler : NotificationEventHandlerBase<TaskApprovedEvent>, IIntegrationEventHandler<TaskApprovedEvent>
{
    public TaskApprovedEventHandler(
        INotificationRepository repository,
        INotificationUnitOfWork unitOfWork,
        INotificationRealtimePublisher realtimePublisher,
        ILogger<TaskApprovedEventHandler> logger)
        : base(repository, unitOfWork, realtimePublisher, logger)
    {
    }

    public Task HandleAsync(TaskApprovedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, ct =>
        {
            LogOnly("TaskApprovedEvent received for task {TaskId}. No notification target is available in this event.", eventMessage.TaskId);
            return Task.CompletedTask;
        }, cancellationToken);
}
