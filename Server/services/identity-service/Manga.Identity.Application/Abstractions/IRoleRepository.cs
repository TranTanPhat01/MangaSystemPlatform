using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Application.Abstractions;

public interface IRoleRepository
{
    Task<IReadOnlyList<Role>> ListAsync(CancellationToken cancellationToken = default);
    Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
}
