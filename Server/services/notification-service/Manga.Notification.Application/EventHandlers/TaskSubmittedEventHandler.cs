using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class TaskSubmittedEventHandler : NotificationEventHandlerBase<TaskSubmittedEvent>, IIntegrationEventHandler<TaskSubmittedEvent>
{
    public TaskSubmittedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, ILogger<TaskSubmittedEventHandler> logger)
        : base(repository, unitOfWork, logger)
    {
    }

    public Task HandleAsync(TaskSubmittedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, async ct =>
        {
            await CreateNotificationIfMissingAsync(
                eventMessage.SubmittedByUserId,
                "Task submitted",
                $"Task {eventMessage.TaskId} has been submitted.",
                NotificationType.TaskSubmitted,
                eventMessage.MessageId,
                ct);
        }, cancellationToken);
}
