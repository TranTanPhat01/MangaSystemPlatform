using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MangaSystemPlatform.GrpcIntegrationTests;

[Collection("GatewayEnvironment")]
public sealed class GatewayHttpIntegrationTests
{
    [Fact]
    public async Task HealthLive_ReturnsStructuredSuccessAndSecurityHeaders()
    {
        using var environment = new GatewayEnvironmentScope("Development");
        using var factory = CreateFactory("Development");
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/health/live");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.GetValues("X-Content-Type-Options").Should().Contain("nosniff");
        response.Headers.GetValues("X-Frame-Options").Should().Contain("DENY");
        response.Headers.GetValues("Referrer-Policy").Should().Contain("no-referrer");
        response.Headers.Contains("Server").Should().BeFalse();
    }

    [Fact]
    public async Task Production_DetailedServicesHealth_RequiresAuthorization()
    {
        using var environment = new GatewayEnvironmentScope("Production");
        using var factory = CreateFactory("Production");
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/health/services");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UnavailableDownstream_ReturnsSafeBadGatewayResponse()
    {
        using var environment = new GatewayEnvironmentScope("Development", new Dictionary<string, string?>
        {
            ["ReverseProxy:Clusters:identity-cluster:Destinations:identity-api:Address"] = "http://127.0.0.1:1/"
        });
        using var factory = CreateFactory("Development");
        using var client = factory.CreateClient();

        using var response = await client.PostAsync("/identity/auth/login", new StringContent("{}", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
        content.Should().Contain("DOWNSTREAM_UNAVAILABLE");
        content.Should().NotContain("stackTrace");
    }

    private static WebApplicationFactory<Program> CreateFactory(string environment) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment(environment);
        });

    private sealed class GatewayEnvironmentScope : IDisposable
    {
        private readonly Dictionary<string, string?> _previousValues = new();

        public GatewayEnvironmentScope(string environment, IReadOnlyDictionary<string, string?>? overrides = null)
        {
            var values = new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = environment,
                ["Jwt__Issuer"] = "MangaSystemPlatform.Identity",
                ["Jwt__Audience"] = "MangaSystemPlatform.Client",
                ["Jwt__SecretKey"] = "a-valid-local-jwt-signing-key-that-is-longer-than-thirty-two-characters",
                ["Gateway__TransportSecurity__EnableHttpsRedirection"] = "false",
                ["Gateway__TransportSecurity__EnableHsts"] = "false"
            };
            if (overrides is not null)
            {
                foreach (var item in overrides) values[item.Key.Replace(":", "__", StringComparison.Ordinal)] = item.Value;
            }

            foreach (var item in values)
            {
                _previousValues[item.Key] = Environment.GetEnvironmentVariable(item.Key);
                Environment.SetEnvironmentVariable(item.Key, item.Value);
            }
        }

        public void Dispose()
        {
            foreach (var item in _previousValues) Environment.SetEnvironmentVariable(item.Key, item.Value);
        }
    }
}

[CollectionDefinition("GatewayEnvironment", DisableParallelization = true)]
public sealed class GatewayEnvironmentCollection
{
}
