using System.Text.Json;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Editorial.Application.EventHandlers;

public sealed class TaskAssignedEventHandler : IIntegrationEventHandler<TaskAssignedEvent>
{
    private readonly IEditorialRepository _repository;
    private readonly IEditorialUnitOfWork _unitOfWork;
    private readonly ILogger<TaskAssignedEventHandler> _logger;

    public TaskAssignedEventHandler(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork, ILogger<TaskAssignedEventHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task HandleAsync(TaskAssignedEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var inbox = await GetOrCreateInboxAsync(eventMessage.MessageId, nameof(TaskAssignedEvent), eventMessage, cancellationToken);
        if (inbox.Status == InboxMessageStatus.Processed) return;

        _logger.LogInformation("TaskAssignedEvent received for task {TaskId}.", eventMessage.TaskId);
        inbox.Status = InboxMessageStatus.Processed;
        inbox.ProcessedAt = DateTime.UtcNow;
        inbox.Error = null;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<InboxMessage> GetOrCreateInboxAsync(Guid messageId, string eventType, object payload, CancellationToken cancellationToken)
    {
        var existing = (await _repository.ListAsync<InboxMessage>(message => message.MessageId == messageId, cancellationToken)).FirstOrDefault();
        if (existing is not null) return existing;

        var inbox = new InboxMessage { MessageId = messageId, EventType = eventType, Payload = JsonSerializer.Serialize(payload), ReceivedAt = DateTime.UtcNow };
        await _repository.AddAsync(inbox, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return inbox;
    }
}
