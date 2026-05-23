using System.Text.Json;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Management.Application.EventHandlers;

public sealed class ChapterApprovedEventHandler : IIntegrationEventHandler<ChapterApprovedEvent>
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly ILogger<ChapterApprovedEventHandler> _logger;

    public ChapterApprovedEventHandler(IManagementRepository repository, IManagementUnitOfWork unitOfWork, ILogger<ChapterApprovedEventHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task HandleAsync(ChapterApprovedEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var inbox = await GetOrCreateInboxAsync(eventMessage, cancellationToken);
        if (inbox.Status == InboxMessageStatus.Processed) return;

        try
        {
            var chapter = await _repository.GetByIdAsync<Chapter>(eventMessage.ChapterId, cancellationToken);
            if (chapter is null)
            {
                _logger.LogWarning("ChapterApprovedEvent skipped because chapter {ChapterId} was not found.", eventMessage.ChapterId);
            }
            else
            {
                chapter.Status = ChapterStatus.Approved;
                chapter.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("Chapter {ChapterId} marked Approved from ChapterApprovedEvent.", chapter.Id);
            }

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

    private async Task<InboxMessage> GetOrCreateInboxAsync(ChapterApprovedEvent eventMessage, CancellationToken cancellationToken)
    {
        var existing = (await _repository.ListAsync<InboxMessage>(message => message.MessageId == eventMessage.MessageId, cancellationToken)).FirstOrDefault();
        if (existing is not null) return existing;

        var inbox = new InboxMessage
        {
            MessageId = eventMessage.MessageId,
            EventType = nameof(ChapterApprovedEvent),
            Payload = JsonSerializer.Serialize(eventMessage),
            ReceivedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(inbox, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return inbox;
    }
}
