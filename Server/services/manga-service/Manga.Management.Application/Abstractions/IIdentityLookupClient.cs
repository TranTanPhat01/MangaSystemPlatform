using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Abstractions;

public interface IIdentityLookupClient
{
    Task<bool> CheckUserExistsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserSummaryDto?> GetUserSummaryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CheckUserRoleAsync(Guid userId, string role, CancellationToken cancellationToken = default);
}
