using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public sealed class FileUploadedEventHandler : NotificationEventHandlerBase<FileUploadedEvent>, IIntegrationEventHandler<FileUploadedEvent>
{
    public FileUploadedEventHandler(INotificationRepository repository, INotificationUnitOfWork unitOfWork, ILogger<FileUploadedEventHandler> logger)
        : base(repository, unitOfWork, logger)
    {
    }

    public Task HandleAsync(FileUploadedEvent eventMessage, CancellationToken cancellationToken = default) =>
        HandleWithInboxAsync(eventMessage.MessageId, eventMessage, async ct =>
        {
            await CreateNotificationIfMissingAsync(
                eventMessage.UploadedByUserId,
                "File uploaded",
                $"File '{eventMessage.OriginalFileName}' has been uploaded.",
                NotificationType.FileUploaded,
                eventMessage.MessageId,
                ct);
        }, cancellationToken);
}
