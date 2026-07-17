namespace Manga.File.Application.Services;

public interface ICurrentUserService
{
    Guid UserId { get; }

    bool IsInRole(string role) => false;
}
