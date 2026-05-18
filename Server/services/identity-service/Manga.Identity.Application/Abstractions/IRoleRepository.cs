using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Application.Abstractions;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
}
