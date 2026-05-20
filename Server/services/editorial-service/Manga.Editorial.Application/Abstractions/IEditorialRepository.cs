using System.Linq.Expressions;

namespace Manga.Editorial.Application.Abstractions;

public interface IEditorialRepository
{
    Task<T?> GetByIdAsync<T>(Guid id, CancellationToken cancellationToken = default) where T : class;
    Task<IReadOnlyList<T>> ListAsync<T>(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default) where T : class;
    Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class;
}
