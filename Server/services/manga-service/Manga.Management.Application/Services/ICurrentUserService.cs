namespace Manga.Management.Application.Services;

public interface ICurrentUserService
{
    Guid UserId { get; }

    bool IsInRole(string role);
}
