using FluentAssertions;
using Manga.Gateway;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class GatewaySecurityTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("change-this-development-secret-key-32-plus-chars")]
    [InlineData("short-secret")]
    public void JwtValidation_RejectsMissingPlaceholderAndShortSecrets(string? secret)
    {
        var configuration = Configuration(secret);

        var action = () => GatewaySecurity.GetValidatedJwtSecret(configuration);

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void JwtValidation_AcceptsNonPlaceholderSecretOfSufficientLength()
    {
        var configuration = Configuration("a-valid-local-jwt-signing-key-that-is-longer-than-thirty-two-characters");

        GatewaySecurity.GetValidatedJwtSecret(configuration)
            .Should().Be("a-valid-local-jwt-signing-key-that-is-longer-than-thirty-two-characters");
    }

    [Fact]
    public void ForwardedHeaders_AreEnabledOnlyForConfiguredTrustedProxy()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ForwardedHeaders:Enabled"] = "true",
            ["ForwardedHeaders:KnownProxies:0"] = "10.0.0.10"
        }).Build();

        GatewaySecurity.TryBuildForwardedHeadersOptions(configuration, NullLogger.Instance, out var options).Should().BeTrue();
        options.KnownProxies.Should().ContainSingle(proxy => proxy.ToString() == "10.0.0.10");
    }

    [Fact]
    public void ForwardedHeaders_AreNotEnabledWithoutTrustedProxyOrNetwork()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ForwardedHeaders:Enabled"] = "true",
            ["ForwardedHeaders:KnownProxies:0"] = "not-an-ip"
        }).Build();

        GatewaySecurity.TryBuildForwardedHeadersOptions(configuration, NullLogger.Instance, out _).Should().BeFalse();
    }

    [Fact]
    public void RateLimitPartition_UsesAuthenticatedUserBeforeClientIp()
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.0.2.10");
        context.User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity([new("sub", "user-123")], "test"));

        GatewaySecurity.GetRateLimitPartitionKey(context).Should().Be("user:user-123");
    }

    private static IConfiguration Configuration(string? secret) => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:SecretKey"] = secret })
        .Build();
}
