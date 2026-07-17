namespace Manga.Notification.Application.Services;

public interface ICurrentUserService
{
    Guid UserId { get; }

    bool IsInRole(string role) => false;
}
