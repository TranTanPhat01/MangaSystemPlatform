using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;

namespace Manga.Gateway;

public static class GatewaySecurity
{
    private static readonly string[] UnsafeSecretFragments = ["change-this", "development-secret", "your-secret"];

    public static string GetValidatedJwtSecret(IConfiguration configuration)
    {
        var secret = configuration["Jwt:SecretKey"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32 ||
            UnsafeSecretFragments.Any(fragment => secret.Contains(fragment, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("Jwt:SecretKey must be configured with a non-placeholder value of at least 32 characters.");
        }

        return secret;
    }

    public static bool TryBuildForwardedHeadersOptions(IConfiguration configuration, ILogger logger, out ForwardedHeadersOptions options)
    {
        options = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
        };

        if (!configuration.GetValue("ForwardedHeaders:Enabled", false))
        {
            return false;
        }

        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
        foreach (var value in configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>() ?? [])
        {
            if (IPAddress.TryParse(value, out var proxy))
            {
                options.KnownProxies.Add(proxy);
            }
            else
            {
                logger.LogWarning("Ignoring invalid ForwardedHeaders known proxy value.");
            }
        }

        foreach (var value in configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]>() ?? [])
        {
            if (TryParseNetwork(value, out var network))
            {
                options.KnownNetworks.Add(network);
            }
            else
            {
                logger.LogWarning("Ignoring invalid ForwardedHeaders known network value.");
            }
        }

        if (options.KnownProxies.Count == 0 && options.KnownNetworks.Count == 0)
        {
            logger.LogWarning("Forwarded headers were enabled without trusted proxies or networks. Forwarded headers will not be applied.");
            return false;
        }

        return true;
    }

    public static string GetRateLimitPartitionKey(HttpContext context)
    {
        var userId = context.User.FindFirst("sub")?.Value;
        return !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : $"ip:{context.Connection.RemoteIpAddress}";
    }

    private static bool TryParseNetwork(string? value, out Microsoft.AspNetCore.HttpOverrides.IPNetwork network)
    {
        network = default!;
        var parts = value?.Split('/', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts is not [var addressValue, var prefixValue] ||
            !IPAddress.TryParse(addressValue, out var address) ||
            !int.TryParse(prefixValue, out var prefixLength))
        {
            return false;
        }

        var maximumPrefixLength = address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork ? 32 : 128;
        if (prefixLength < 0 || prefixLength > maximumPrefixLength)
        {
            return false;
        }

        network = new Microsoft.AspNetCore.HttpOverrides.IPNetwork(address, prefixLength);
        return true;
    }
}

public static class GatewayProxyConfiguration
{
    public static void ApplyTimeouts(ConfigurationManager configuration)
    {
        var defaultTimeout = Math.Clamp(configuration.GetValue("Gateway:DefaultProxyTimeoutSeconds", 120), 10, 600);
        var fileTimeout = Math.Clamp(configuration.GetValue("Gateway:FileProxyTimeoutSeconds", 600), defaultTimeout, 1800);
        var defaultActivityTimeout = TimeSpan.FromSeconds(defaultTimeout).ToString("c");
        configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ReverseProxy:Clusters:identity-cluster:HttpClient:ActivityTimeout"] = defaultActivityTimeout,
            ["ReverseProxy:Clusters:manga-cluster:HttpClient:ActivityTimeout"] = defaultActivityTimeout,
            ["ReverseProxy:Clusters:files-cluster:HttpClient:ActivityTimeout"] = TimeSpan.FromSeconds(fileTimeout).ToString("c"),
            ["ReverseProxy:Clusters:editorial-cluster:HttpClient:ActivityTimeout"] = defaultActivityTimeout,
            ["ReverseProxy:Clusters:notifications-cluster:HttpClient:ActivityTimeout"] = defaultActivityTimeout
        });
    }
}
