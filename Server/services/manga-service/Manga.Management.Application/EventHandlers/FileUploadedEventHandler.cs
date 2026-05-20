using System.Text.Json;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Management.Application.EventHandlers;

public sealed class FileUploadedEventHandler : IIntegrationEventHandler<FileUploadedEvent>
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly ILogger<FileUploadedEventHandler> _logger;

    public FileUploadedEventHandler(
        IManagementRepository repository,
        IManagementUnitOfWork unitOfWork,
        ILogger<FileUploadedEventHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task HandleAsync(FileUploadedEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var inbox = await GetOrCreateInboxAsync(eventMessage.MessageId, nameof(FileUploadedEvent), eventMessage, cancellationToken);
        if (inbox.Status == InboxMessageStatus.Processed)
        {
            return;
        }

        try
        {
            if (eventMessage.FileCategory == "MangaPage")
            {
                _logger.LogInformation("FileUploadedEvent received for manga page file {FileId}", eventMessage.FileId);
            }

            MarkProcessed(inbox);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            await MarkFailedAsync(inbox, exception, cancellationToken);
            throw;
        }
    }

    private async Task<InboxMessage> GetOrCreateInboxAsync(Guid messageId, string eventType, object payload, CancellationToken cancellationToken)
    {
        var existing = (await _repository.ListAsync<InboxMessage>(message => message.MessageId == messageId, cancellationToken)).FirstOrDefault();
        if (existing is not null)
        {
            return existing;
        }

        var inbox = new InboxMessage
        {
            MessageId = messageId,
            EventType = eventType,
            Payload = JsonSerializer.Serialize(payload),
            ReceivedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(inbox, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return inbox;
    }

    private static void MarkProcessed(InboxMessage inbox)
    {
        inbox.Status = InboxMessageStatus.Processed;
        inbox.ProcessedAt = DateTime.UtcNow;
        inbox.Error = null;
    }

    private async Task MarkFailedAsync(InboxMessage inbox, Exception exception, CancellationToken cancellationToken)
    {
        inbox.Status = InboxMessageStatus.Failed;
        inbox.Error = exception.Message;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
