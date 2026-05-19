using System.Linq.Expressions;

namespace Manga.Management.Application.Abstractions;

public interface IManagementRepository
{
    Task<T?> GetByIdAsync<T>(Guid id, CancellationToken cancellationToken = default)
        where T : class;

    Task<IReadOnlyList<T>> ListAsync<T>(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
        where T : class;

    Task AddAsync<T>(T entity, CancellationToken cancellationToken = default)
        where T : class;

    void Remove<T>(T entity)
        where T : class;
}
