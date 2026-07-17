using System.IdentityModel.Tokens.Jwt;
using FluentAssertions;
using Manga.BuildingBlocks.Authorization;
using Manga.Identity.Application.Options;
using Manga.Identity.Domain.Entities;
using Manga.Identity.Domain.Enums;
using Manga.Identity.Infrastructure.Persistence;
using Manga.Identity.Infrastructure.Seeding;
using Manga.Identity.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class DevelopmentAdminSeedTests
{
    [Fact]
    public void Production_DoesNotAllowAdminSeed_EvenWhenCredentialsExist()
    {
        var configuration = CreateConfiguration();

        AdminSeedConfiguration.TryGetCredentials("Production", configuration, out var credentials).Should().BeFalse();
        credentials.Should().BeNull();
    }

    [Fact]
    public void BootstrapDisabled_AlwaysSkipsSeed()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["IdentityBootstrap:Enabled"] = "false",
                ["IdentityBootstrap:AdminEmail"] = "admin@example.test",
                ["IdentityBootstrap:AdminPassword"] = "test-password-from-environment"
            })
            .Build();

        AdminSeedConfiguration.TryGetBootstrap("Development", configuration, out var settings).Should().BeFalse();
        settings.Should().BeNull();
    }

    [Fact]
    public void BootstrapRecovery_IsDisabledUnlessExplicitlyEnabled()
    {
        AdminSeedConfiguration.TryGetBootstrap("Development", CreateBootstrapConfiguration(recoveryEnabled: false), out var normal)
            .Should().BeTrue();
        AdminSeedConfiguration.TryGetBootstrap("Development", CreateBootstrapConfiguration(recoveryEnabled: true), out var recovery)
            .Should().BeTrue();

        normal!.RecoveryEnabled.Should().BeFalse();
        recovery!.RecoveryEnabled.Should().BeTrue();
    }

    [Theory]
    [InlineData("Development")]
    [InlineData("Test")]
    public void EligibleEnvironment_RequiresBothEnvironmentCredentials(string environmentName)
    {
        AdminSeedConfiguration.TryGetCredentials(environmentName, new ConfigurationBuilder().Build(), out var missing).Should().BeFalse();
        AdminSeedConfiguration.TryGetCredentials(environmentName, CreateConfiguration(), out var credentials).Should().BeTrue();

        credentials!.Email.Should().Be("admin@example.test");
        credentials.Password.Should().Be("test-password-from-environment");
    }

    [Fact]
    public void AdminJwt_ContainsExistingAdminPermissions()
    {
        var service = new JwtTokenService(Options.Create(new JwtOptions
        {
            Issuer = "test-issuer",
            Audience = "test-audience",
            SecretKey = "test-secret-key-with-at-least-32-characters",
            AccessTokenExpirationMinutes = 30
        }));
        var user = new User { Email = "admin@example.test", Status = UserStatus.Active };
        var permissions = IdentityPermissionCatalog.GetPermissionKeysForRole(IdentityRoleIds.Admin);

        var token = service.GenerateAccessToken(user, new[] { "Admin" }, permissions, DateTime.UtcNow.AddMinutes(30));
        var claims = new JwtSecurityTokenHandler().ReadJwtToken(token).Claims
            .Where(claim => claim.Type == PermissionClaimTypes.Permission)
            .Select(claim => claim.Value)
            .ToArray();

        claims.Should().Contain(PermissionKeys.AdminUserRead);
        claims.Should().Contain(PermissionKeys.AdminMonitoringRead);
    }

    private static IConfiguration CreateConfiguration() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SeedAdmin:Email"] = "ADMIN@EXAMPLE.TEST",
            ["SeedAdmin:Password"] = "test-password-from-environment"
        })
        .Build();

    private static IConfiguration CreateBootstrapConfiguration(bool recoveryEnabled) => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["IdentityBootstrap:Enabled"] = "true",
            ["IdentityBootstrap:AdminEmail"] = "admin@example.test",
            ["IdentityBootstrap:AdminPassword"] = "test-password-from-environment",
            ["IdentityBootstrap:RecoveryEnabled"] = recoveryEnabled.ToString()
        })
        .Build();
}
