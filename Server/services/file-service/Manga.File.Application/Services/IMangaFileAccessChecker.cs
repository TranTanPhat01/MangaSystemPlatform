namespace Manga.File.Application.Services;

public interface IMangaFileAccessChecker
{
    Task<bool> CanReadAsync(Guid userId, Guid fileId, CancellationToken cancellationToken = default);
}
