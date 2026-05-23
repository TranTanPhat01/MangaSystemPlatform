using Manga.Notification.Domain.Enums;

namespace Manga.Notification.Application.DTOs;

public sealed class NotificationResponse
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public NotificationType Type { get; init; }
    public NotificationStatus Status { get; init; }
    public string? SourceEventType { get; init; }
    public Guid? SourceEventId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReadAt { get; init; }
}
