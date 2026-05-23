namespace Manga.Editorial.Application.Abstractions;

public interface IEditorialUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
