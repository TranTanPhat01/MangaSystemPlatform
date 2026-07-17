namespace Manga.Identity.Application.Abstractions;

public interface IPermissionRepository
{
    Task<IReadOnlyCollection<string>> GetKeysByRoleIdsAsync(IReadOnlyCollection<Guid> roleIds, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Domain.Entities.Permission>> GetByKeysAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Domain.Entities.Permission>> ListAsync(CancellationToken cancellationToken = default);
}
