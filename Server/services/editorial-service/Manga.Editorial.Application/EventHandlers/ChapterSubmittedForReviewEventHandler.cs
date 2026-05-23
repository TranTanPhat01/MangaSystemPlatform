using System.Text.Json;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Editorial.Application.EventHandlers;

public sealed class ChapterSubmittedForReviewEventHandler : IIntegrationEventHandler<ChapterSubmittedForReviewEvent>
{
    private readonly IEditorialRepository _repository;
    private readonly IEditorialUnitOfWork _unitOfWork;
    private readonly ILogger<ChapterSubmittedForReviewEventHandler> _logger;

    public ChapterSubmittedForReviewEventHandler(
        IEditorialRepository repository,
        IEditorialUnitOfWork unitOfWork,
        ILogger<ChapterSubmittedForReviewEventHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task HandleAsync(ChapterSubmittedForReviewEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var inbox = await GetOrCreateInboxAsync(eventMessage, cancellationToken);
        if (inbox.Status == InboxMessageStatus.Processed) return;

        try
        {
            var existingReview = (await _repository.ListAsync<EditorialReview>(
                review => review.ChapterId == eventMessage.ChapterId,
                cancellationToken)).FirstOrDefault();

            if (existingReview is null)
            {
                await _repository.AddAsync(new EditorialReview
                {
                    ChapterId = eventMessage.ChapterId,
                    SeriesId = eventMessage.SeriesId,
                    RequestedByUserId = eventMessage.SubmittedByUserId,
                    Status = EditorialReviewStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                _logger.LogInformation("EditorialReview created from ChapterSubmittedForReviewEvent for chapter {ChapterId}.", eventMessage.ChapterId);
            }
            else
            {
                _logger.LogInformation("ChapterSubmittedForReviewEvent skipped because review already exists for chapter {ChapterId}.", eventMessage.ChapterId);
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

    private async Task<InboxMessage> GetOrCreateInboxAsync(ChapterSubmittedForReviewEvent eventMessage, CancellationToken cancellationToken)
    {
        var existing = (await _repository.ListAsync<InboxMessage>(message => message.MessageId == eventMessage.MessageId, cancellationToken)).FirstOrDefault();
        if (existing is not null) return existing;

        var inbox = new InboxMessage
        {
            MessageId = eventMessage.MessageId,
            EventType = nameof(ChapterSubmittedForReviewEvent),
            Payload = JsonSerializer.Serialize(eventMessage),
            ReceivedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(inbox, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return inbox;
    }
}
