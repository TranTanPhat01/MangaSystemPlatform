using Manga.Management.Domain.Enums;

namespace Manga.Management.Domain.Entities;

public sealed class InboxMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MessageId { get; set; }

    public string EventType { get; set; } = string.Empty;

    public string Payload { get; set; } = string.Empty;

    public InboxMessageStatus Status { get; set; } = InboxMessageStatus.Pending;

    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ProcessedAt { get; set; }

    public string? Error { get; set; }
}
