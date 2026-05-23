namespace Manga.Notification.Application.Abstractions;

public interface INotificationUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
