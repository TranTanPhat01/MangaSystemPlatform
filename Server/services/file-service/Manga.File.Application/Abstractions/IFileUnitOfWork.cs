namespace Manga.File.Application.Abstractions;

public interface IFileUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
