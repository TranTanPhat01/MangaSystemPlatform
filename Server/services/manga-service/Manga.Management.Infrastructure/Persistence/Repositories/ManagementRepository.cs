using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Manga.Management.Application.Abstractions;

namespace Manga.Management.Infrastructure.Persistence.Repositories;

internal sealed class ManagementRepository : IManagementRepository
{
    private readonly MangaManagementDbContext _dbContext;

    public ManagementRepository(MangaManagementDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<T?> GetByIdAsync<T>(Guid id, CancellationToken cancellationToken = default)
        where T : class =>
        _dbContext.Set<T>().FindAsync(new object[] { id }, cancellationToken).AsTask();

    public async Task<IReadOnlyList<T>> ListAsync<T>(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
        where T : class
    {
        var query = _dbContext.Set<T>().AsQueryable();
        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task AddAsync<T>(T entity, CancellationToken cancellationToken = default)
        where T : class
    {
        await _dbContext.Set<T>().AddAsync(entity, cancellationToken);
    }

    public void Remove<T>(T entity)
        where T : class
    {
        _dbContext.Set<T>().Remove(entity);
    }
}
