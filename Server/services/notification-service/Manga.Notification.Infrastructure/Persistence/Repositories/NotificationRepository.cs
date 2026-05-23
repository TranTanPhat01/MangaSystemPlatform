using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Entities;
using Manga.Notification.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Manga.Notification.Infrastructure.Persistence.Repositories;

internal sealed class NotificationRepository : INotificationRepository
{
    private readonly NotificationDbContext _dbContext;

    public NotificationRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Domain.Entities.Notification>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _dbContext.Notifications
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _dbContext.Notifications.CountAsync(
            notification => notification.UserId == userId && notification.Status == NotificationStatus.Unread,
            cancellationToken);

    public Task<Domain.Entities.Notification?> GetNotificationAsync(Guid notificationId, CancellationToken cancellationToken = default) =>
        _dbContext.Notifications.FirstOrDefaultAsync(notification => notification.Id == notificationId, cancellationToken);

    public Task<InboxMessage?> GetInboxMessageAsync(Guid messageId, CancellationToken cancellationToken = default) =>
        _dbContext.InboxMessages.FirstOrDefaultAsync(message => message.MessageId == messageId, cancellationToken);

    public async Task AddNotificationAsync(Domain.Entities.Notification notification, CancellationToken cancellationToken = default)
    {
        await _dbContext.Notifications.AddAsync(notification, cancellationToken);
    }

    public async Task AddInboxMessageAsync(InboxMessage inboxMessage, CancellationToken cancellationToken = default)
    {
        await _dbContext.InboxMessages.AddAsync(inboxMessage, cancellationToken);
    }

    public Task<bool> NotificationExistsAsync(
        Guid sourceEventId,
        NotificationType type,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        _dbContext.Notifications.AnyAsync(
            notification =>
                notification.SourceEventId == sourceEventId &&
                notification.Type == type &&
                notification.UserId == userId,
            cancellationToken);

    public void RemoveNotification(Domain.Entities.Notification notification)
    {
        _dbContext.Notifications.Remove(notification);
    }
}
