using Microsoft.Extensions.Configuration;

namespace Manga.Identity.Infrastructure.Seeding;

public sealed record AdminSeedCredentials(string Email, string Password);
public sealed record IdentityBootstrapSettings(AdminSeedCredentials Credentials, bool RecoveryEnabled);

public static class AdminSeedConfiguration
{
    public static bool TryGetCredentials(string environmentName, IConfiguration configuration, out AdminSeedCredentials? credentials)
    {
        var found = TryGetBootstrap(environmentName, configuration, out var settings);
        credentials = settings?.Credentials;
        return found;
    }

    public static bool TryGetBootstrap(string environmentName, IConfiguration configuration, out IdentityBootstrapSettings? settings)
    {
        settings = null;
        if (!IsEligibleEnvironment(environmentName)) return false;
        if (bool.TryParse(configuration["IdentityBootstrap:Enabled"], out var enabled) && !enabled) return false;

        var email = configuration["IdentityBootstrap:AdminEmail"] ?? configuration["SeedAdmin:Email"];
        var password = configuration["IdentityBootstrap:AdminPassword"] ?? configuration["SeedAdmin:Password"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) return false;

        var recoveryEnabled = bool.TryParse(configuration["IdentityBootstrap:RecoveryEnabled"], out var recovery) && recovery;
        settings = new IdentityBootstrapSettings(new AdminSeedCredentials(email.Trim().ToLowerInvariant(), password), recoveryEnabled);
        return true;
    }

    public static bool IsEligibleEnvironment(string environmentName) =>
        string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(environmentName, "Test", StringComparison.OrdinalIgnoreCase);
}
