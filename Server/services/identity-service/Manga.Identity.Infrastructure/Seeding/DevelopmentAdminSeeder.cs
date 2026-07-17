using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Domain.Entities;
using Manga.Identity.Domain.Enums;
using Manga.Identity.Infrastructure.Persistence;

namespace Manga.Identity.Infrastructure.Seeding;

public interface IDevelopmentAdminSeeder
{
    Task SeedAsync(CancellationToken cancellationToken = default);
}

internal sealed class DevelopmentAdminSeeder : IDevelopmentAdminSeeder
{
    private const string AdminRoleName = "Admin";
    private readonly IdentityDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DevelopmentAdminSeeder> _logger;

    public DevelopmentAdminSeeder(
        IdentityDbContext dbContext,
        IPasswordHasher passwordHasher,
        IHostEnvironment environment,
        IConfiguration configuration,
        ILogger<DevelopmentAdminSeeder> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _environment = environment;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (!AdminSeedConfiguration.IsEligibleEnvironment(_environment.EnvironmentName))
        {
            _logger.LogInformation("Development admin seeding is disabled in {EnvironmentName}.", _environment.EnvironmentName);
            return;
        }

        if (!AdminSeedConfiguration.TryGetBootstrap(_environment.EnvironmentName, _configuration, out var bootstrap))
        {
            _logger.LogWarning("Development admin seed skipped because IdentityBootstrap credentials are not configured.");
            return;
        }

        if (bootstrap is null)
        {
            return;
        }

        var adminRole = await _dbContext.Roles.SingleOrDefaultAsync(role => role.Name == AdminRoleName, cancellationToken);
        if (adminRole is null)
        {
            _logger.LogWarning("Development admin seed skipped because the Admin role is not available.");
            return;
        }

        var user = await _dbContext.Users
            .Include(candidate => candidate.UserRoles)
            .ThenInclude(userRole => userRole.Role)
            .SingleOrDefaultAsync(candidate => candidate.Email == bootstrap.Credentials.Email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Email = bootstrap.Credentials.Email,
                FullName = "Development Administrator",
                PasswordHash = _passwordHasher.HashPassword(bootstrap.Credentials.Password),
                Status = UserStatus.Active,
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                UserRoles = new List<UserRole>()
            };
            await _dbContext.Users.AddAsync(user, cancellationToken);
        }
        else if (bootstrap.RecoveryEnabled)
        {
            user.PasswordHash = _passwordHasher.HashPassword(bootstrap.Credentials.Password);
            user.Status = UserStatus.Active;
            user.EmailVerified = true;
            user.LockoutUntil = null;
            user.LockReason = null;
            user.LockedByUserId = null;
            user.DeletedAt = null;
            user.DeletedByUserId = null;
            user.UpdatedAt = DateTime.UtcNow;
            var tokens = await _dbContext.RefreshTokens
                .Where(token => token.UserId == user.Id && token.RevokedAt == null && token.ExpiresAt > DateTime.UtcNow)
                .ToListAsync(cancellationToken);
            foreach (var token in tokens) token.RevokedAt = DateTime.UtcNow;
            await _dbContext.AdminAuditEvents.AddAsync(new AdminAuditEvent
            {
                ActorUserId = user.Id,
                TargetUserId = user.Id,
                Action = "IdentityBootstrapRecovery",
                Details = "Explicit bootstrap recovery reset credentials and restored account access."
            }, cancellationToken);
        }

        if (!user.UserRoles.Any(userRole => userRole.RoleId == adminRole.Id))
        {
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = adminRole.Id, Role = adminRole });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        if (bootstrap.RecoveryEnabled)
            _logger.LogWarning("Development admin recovery completed. Disable IdentityBootstrap__RecoveryEnabled immediately after use.");
        else
            _logger.LogInformation("Development admin seed ensured without resetting existing credentials.");
    }
}
