using Manga.Notification.Domain.Enums;

namespace Manga.Notification.Domain.Entities;

public sealed class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public NotificationType Type { get; set; } = NotificationType.System;

    public NotificationStatus Status { get; set; } = NotificationStatus.Unread;

    public string? SourceEventType { get; set; }

    public Guid? SourceEventId { get; set; }

    public string? ResourceType { get; set; }

    public Guid? ResourceId { get; set; }

    public string? ActionUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReadAt { get; set; }
}
