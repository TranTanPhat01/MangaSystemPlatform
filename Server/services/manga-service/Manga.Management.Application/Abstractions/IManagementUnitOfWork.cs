namespace Manga.Management.Application.Abstractions;

public interface IManagementUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
