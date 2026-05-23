using Manga.Notification.Domain.Entities;
using Manga.Notification.Domain.Enums;

namespace Manga.Notification.Application.Abstractions;

public interface INotificationRepository
{
    Task<IReadOnlyList<Domain.Entities.Notification>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<Domain.Entities.Notification?> GetNotificationAsync(Guid notificationId, CancellationToken cancellationToken = default);

    Task<InboxMessage?> GetInboxMessageAsync(Guid messageId, CancellationToken cancellationToken = default);

    Task AddNotificationAsync(Domain.Entities.Notification notification, CancellationToken cancellationToken = default);

    Task AddInboxMessageAsync(InboxMessage inboxMessage, CancellationToken cancellationToken = default);

    Task<bool> NotificationExistsAsync(Guid sourceEventId, NotificationType type, Guid userId, CancellationToken cancellationToken = default);

    void RemoveNotification(Domain.Entities.Notification notification);
}
