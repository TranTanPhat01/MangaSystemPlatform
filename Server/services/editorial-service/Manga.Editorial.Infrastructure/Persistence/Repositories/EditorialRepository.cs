using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Manga.Editorial.Application.Abstractions;

namespace Manga.Editorial.Infrastructure.Persistence.Repositories;

internal sealed class EditorialRepository : IEditorialRepository
{
    private readonly EditorialDbContext _dbContext;
    public EditorialRepository(EditorialDbContext dbContext) { _dbContext = dbContext; }
    public Task<T?> GetByIdAsync<T>(Guid id, CancellationToken cancellationToken = default) where T : class => _dbContext.Set<T>().FindAsync(new object[] { id }, cancellationToken).AsTask();
    public async Task<IReadOnlyList<T>> ListAsync<T>(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default) where T : class
    {
        var query = _dbContext.Set<T>().AsQueryable();
        if (typeof(T).Name == "RankingSnapshot") query = query.Include("Items");
        if (predicate is not null) query = query.Where(predicate);
        return await query.ToListAsync(cancellationToken);
    }
    public async Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class => await _dbContext.Set<T>().AddAsync(entity, cancellationToken);
}
