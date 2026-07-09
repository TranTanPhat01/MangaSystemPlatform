using Manga.Notification.Application.DTOs;

namespace Manga.Notification.Application.Abstractions;

public interface INotificationRealtimePublisher
{
    Task PublishAsync(NotificationResponse notification, CancellationToken cancellationToken = default);
}
