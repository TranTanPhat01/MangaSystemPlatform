using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.Options;
using Manga.Identity.Infrastructure.Persistence;
using Manga.Identity.Infrastructure.Persistence.Repositories;
using Manga.Identity.Infrastructure.Services;

namespace Manga.Identity.Infrastructure.DependencyInjection;

public static class IdentityInfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtOptions>(options =>
        {
            options.Issuer = configuration["Jwt:Issuer"] ?? string.Empty;
            options.Audience = configuration["Jwt:Audience"] ?? string.Empty;
            options.SecretKey = configuration["Jwt:SecretKey"] ?? string.Empty;
            options.AccessTokenExpirationMinutes = GetInt(configuration, "Jwt:AccessTokenExpirationMinutes", 30);
            options.RefreshTokenExpirationDays = GetInt(configuration, "Jwt:RefreshTokenExpirationDays", 7);
        });

        services.AddDbContext<IdentityDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("IdentityDb")));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IIdentityUnitOfWork>(provider => provider.GetRequiredService<IdentityDbContext>());
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IJwtOptionsProvider, JwtOptionsProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();

        return services;
    }

    private static int GetInt(IConfiguration configuration, string key, int defaultValue)
    {
        return int.TryParse(configuration[key], out var value) ? value : defaultValue;
    }
}
