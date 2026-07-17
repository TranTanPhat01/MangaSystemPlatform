using Microsoft.EntityFrameworkCore;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Infrastructure.Persistence.Repositories;

internal sealed class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly IdentityDbContext _dbContext;

    public RefreshTokenRepository(IdentityDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<RefreshToken?> GetActiveTokenAsync(string token, CancellationToken cancellationToken = default) =>
        _dbContext.RefreshTokens
            .Include(refreshToken => refreshToken.User)
                .ThenInclude(user => user!.UserRoles)
                .ThenInclude(userRole => userRole.Role)
            .FirstOrDefaultAsync(
                refreshToken => refreshToken.Token == token &&
                    refreshToken.RevokedAt == null &&
                    refreshToken.ExpiresAt > DateTime.UtcNow,
                cancellationToken);

    public async Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        await _dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken);
    }

    public async Task RevokeActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tokens = await _dbContext.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAt == null && token.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }
    }
}
