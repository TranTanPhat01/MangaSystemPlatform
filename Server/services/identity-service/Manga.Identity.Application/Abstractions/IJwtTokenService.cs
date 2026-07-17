using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Application.Abstractions;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user, IReadOnlyCollection<string> roles, IReadOnlyCollection<string> permissions, DateTime expiresAt);
    string GenerateRefreshToken();
}
