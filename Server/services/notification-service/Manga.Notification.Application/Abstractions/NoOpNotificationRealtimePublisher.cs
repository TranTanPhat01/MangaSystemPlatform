using Manga.Notification.Application.DTOs;

namespace Manga.Notification.Application.Abstractions;

public sealed class NoOpNotificationRealtimePublisher : INotificationRealtimePublisher
{
    public Task PublishAsync(NotificationResponse notification, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
