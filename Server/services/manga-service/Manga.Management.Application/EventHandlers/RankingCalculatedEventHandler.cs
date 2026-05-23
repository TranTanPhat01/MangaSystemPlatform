using System.Text.Json;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Manga.Management.Application.EventHandlers;

public sealed class RankingCalculatedEventHandler : IIntegrationEventHandler<RankingCalculatedEvent>
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly ILogger<RankingCalculatedEventHandler> _logger;

    public RankingCalculatedEventHandler(IManagementRepository repository, IManagementUnitOfWork unitOfWork, ILogger<RankingCalculatedEventHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task HandleAsync(RankingCalculatedEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var existing = (await _repository.ListAsync<InboxMessage>(message => message.MessageId == eventMessage.MessageId, cancellationToken)).FirstOrDefault();
        if (existing?.Status == InboxMessageStatus.Processed) return;

        var inbox = existing ?? new InboxMessage
        {
            MessageId = eventMessage.MessageId,
            EventType = nameof(RankingCalculatedEvent),
            Payload = JsonSerializer.Serialize(eventMessage),
            ReceivedAt = DateTime.UtcNow
        };

        if (existing is null)
        {
            await _repository.AddAsync(inbox, cancellationToken);
        }

        _logger.LogInformation("RankingCalculatedEvent received for issue {IssueId}, snapshot {RankingSnapshotId}.", eventMessage.IssueId, eventMessage.RankingSnapshotId);
        inbox.Status = InboxMessageStatus.Processed;
        inbox.ProcessedAt = DateTime.UtcNow;
        inbox.Error = null;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
