using System.Text.Json;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Management.Application.EventHandlers;

public sealed class ChapterReviewDecisionEventHandler : IIntegrationEventHandler<ChapterReviewDecisionEvent>
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly ILogger<ChapterReviewDecisionEventHandler> _logger;

    public ChapterReviewDecisionEventHandler(IManagementRepository repository, IManagementUnitOfWork unitOfWork, ILogger<ChapterReviewDecisionEventHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task HandleAsync(ChapterReviewDecisionEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var inbox = await GetOrCreateInboxAsync(eventMessage, cancellationToken);
        if (inbox.Status == InboxMessageStatus.Processed) return;

        try
        {
            var chapter = await _repository.GetByIdAsync<Chapter>(eventMessage.ChapterId, cancellationToken);
            if (chapter is null)
            {
                _logger.LogWarning("ChapterReviewDecisionEvent skipped because chapter {ChapterId} was not found.", eventMessage.ChapterId);
            }
            else if (chapter.Status != ChapterStatus.SubmittedForReview)
            {
                _logger.LogWarning("ChapterReviewDecisionEvent ignored for chapter {ChapterId} because current status is {Status} (expected SubmittedForReview).", chapter.Id, chapter.Status);
            }
            else if (string.Equals(eventMessage.Decision, "RevisionRequested", StringComparison.Ordinal))
            {
                chapter.Status = ChapterStatus.RevisionRequired;
                chapter.UpdatedAt = DateTime.UtcNow;
            }
            else if (string.Equals(eventMessage.Decision, "Rejected", StringComparison.Ordinal))
            {
                chapter.Status = ChapterStatus.Rejected;
                chapter.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _logger.LogWarning("ChapterReviewDecisionEvent ignored unsupported decision {Decision} for chapter {ChapterId}.", eventMessage.Decision, eventMessage.ChapterId);
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

    private async Task<InboxMessage> GetOrCreateInboxAsync(ChapterReviewDecisionEvent eventMessage, CancellationToken cancellationToken)
    {
        var existing = (await _repository.ListAsync<InboxMessage>(message => message.MessageId == eventMessage.MessageId, cancellationToken)).FirstOrDefault();
        if (existing is not null) return existing;

        var inbox = new InboxMessage { MessageId = eventMessage.MessageId, EventType = nameof(ChapterReviewDecisionEvent), Payload = JsonSerializer.Serialize(eventMessage), ReceivedAt = DateTime.UtcNow };
        await _repository.AddAsync(inbox, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return inbox;
    }
}
