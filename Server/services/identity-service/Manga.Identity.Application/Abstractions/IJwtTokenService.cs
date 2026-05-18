using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Application.Abstractions;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user, IReadOnlyCollection<string> roles, DateTime expiresAt);
    string GenerateRefreshToken();
}
