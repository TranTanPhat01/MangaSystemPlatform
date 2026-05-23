using Manga.BuildingBlocks.Exceptions;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Application.DTOs;
using Manga.Notification.Domain.Enums;

namespace Manga.Notification.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public NotificationService(
        INotificationRepository repository,
        INotificationUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<NotificationResponse>> GetMineAsync(CancellationToken cancellationToken = default)
    {
        var notifications = await _repository.GetByUserAsync(_currentUser.UserId, cancellationToken);
        return notifications.Select(ToResponse).ToArray();
    }

    public async Task<UnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default) =>
        new() { Count = await _repository.CountUnreadAsync(_currentUser.UserId, cancellationToken) };

    public async Task<NotificationResponse> MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var notification = await GetOwnedNotificationAsync(notificationId, cancellationToken);
        if (notification.Status == NotificationStatus.Unread)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return ToResponse(notification);
    }

    public async Task<UnreadCountResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default)
    {
        var notifications = await _repository.GetByUserAsync(_currentUser.UserId, cancellationToken);
        foreach (var notification in notifications.Where(notification => notification.Status == NotificationStatus.Unread))
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetUnreadCountAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var notification = await GetOwnedNotificationAsync(notificationId, cancellationToken);
        _repository.RemoveNotification(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Domain.Entities.Notification> GetOwnedNotificationAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        var notification = await _repository.GetNotificationAsync(notificationId, cancellationToken);
        if (notification is null || notification.UserId != _currentUser.UserId)
        {
            throw new NotFoundException("Notification not found.", "NOTIFICATION_NOT_FOUND");
        }

        return notification;
    }

    private static NotificationResponse ToResponse(Domain.Entities.Notification notification) => new()
    {
        Id = notification.Id,
        UserId = notification.UserId,
        Title = notification.Title,
        Message = notification.Message,
        Type = notification.Type,
        Status = notification.Status,
        SourceEventType = notification.SourceEventType,
        SourceEventId = notification.SourceEventId,
        CreatedAt = notification.CreatedAt,
        ReadAt = notification.ReadAt
    };
}
