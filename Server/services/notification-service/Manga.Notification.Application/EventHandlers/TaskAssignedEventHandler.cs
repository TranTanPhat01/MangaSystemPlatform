using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class TaskAssignedEventHandler : NotificationEventHandlerBase<TaskAssignedEvent>, IIntegrationEventHandler<TaskAssignedEvent>
{
    public TaskAssignedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, ILogger<TaskAssignedEventHandler> logger)
        : base(repository, unitOfWork, logger)
    {
    }

    public Task HandleAsync(TaskAssignedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, async ct =>
        {
            await CreateNotificationIfMissingAsync(
                eventMessage.AssignedToUserId,
                "New task assigned",
                $"You have been assigned task {eventMessage.TaskId}.",
                NotificationType.TaskAssigned,
                eventMessage.MessageId,
                ct);
        }, cancellationToken);
}
