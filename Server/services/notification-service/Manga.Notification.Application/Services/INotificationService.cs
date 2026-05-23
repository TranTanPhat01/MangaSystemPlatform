using Manga.Notification.Application.DTOs;

namespace Manga.Notification.Application.Services;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationResponse>> GetMineAsync(CancellationToken cancellationToken = default);

    Task<UnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default);

    Task<NotificationResponse> MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default);

    Task<UnreadCountResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid notificationId, CancellationToken cancellationToken = default);
}
