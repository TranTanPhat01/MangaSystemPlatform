using System.Text.Json;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Entities;
using Manga.Notification.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Notification.Application.EventHandlers;

public abstract class NotificationEventHandlerBase<TEvent>
    where TEvent : class
{
    private readonly INotificationRepository _repository;
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ILogger _logger;

    protected NotificationEventHandlerBase(
        INotificationRepository repository,
        INotificationUnitOfWork unitOfWork,
        ILogger logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    protected async Task HandleWithInboxAsync(
        Guid messageId,
        TEvent eventMessage,
        Func<CancellationToken, Task> handle,
        CancellationToken cancellationToken)
    {
        var inbox = await GetOrCreateInboxAsync(messageId, eventMessage, cancellationToken);
        if (inbox.Status == InboxMessageStatus.Processed)
        {
            _logger.LogInformation("{EventType} skipped because message {MessageId} is already processed.", typeof(TEvent).Name, messageId);
            return;
        }

        try
        {
            await handle(cancellationToken);
            inbox.Status = InboxMessageStatus.Processed;
            inbox.ProcessedAt = DateTime.UtcNow;
            inbox.Error = null;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            inbox.Status = InboxMessageStatus.Failed;
            inbox.Error = exception.Message;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw;
        }
    }

    protected async Task CreateNotificationIfMissingAsync(
        Guid userId,
        string title,
        string message,
        NotificationType type,
        Guid sourceEventId,
        CancellationToken cancellationToken)
    {
        if (userId == Guid.Empty)
        {
            _logger.LogWarning("{EventType} skipped notification because target user id is empty.", typeof(TEvent).Name);
            return;
        }

        if (await _repository.NotificationExistsAsync(sourceEventId, type, userId, cancellationToken))
        {
            _logger.LogInformation("{EventType} notification already exists for user {UserId}.", typeof(TEvent).Name, userId);
            return;
        }

        await _repository.AddNotificationAsync(new Domain.Entities.Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            SourceEventType = typeof(TEvent).Name,
            SourceEventId = sourceEventId,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
    }

    protected void LogOnly(string message, params object?[] args) => _logger.LogInformation(message, args);

    private async Task<InboxMessage> GetOrCreateInboxAsync(Guid messageId, TEvent eventMessage, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetInboxMessageAsync(messageId, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var inbox = new InboxMessage
        {
            MessageId = messageId,
            EventType = typeof(TEvent).Name,
            Payload = JsonSerializer.Serialize(eventMessage),
            ReceivedAt = DateTime.UtcNow
        };

        await _repository.AddInboxMessageAsync(inbox, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return inbox;
    }
}
