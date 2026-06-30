using FluentAssertions;
using Manga.BuildingBlocks.Health;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class InternalGrpcHealthCheckTests
{
    [Fact]
    public async Task HealthCheck_WithValidInternalGrpcConfig_ReturnsHealthy()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["InternalGrpc:ApiKey"] = "test-key",
                ["Grpc:Identity:Address"] = "http://localhost:6207",
                ["Grpc:File:Address"] = "http://localhost:6154",
                ["Grpc:Manga:Address"] = "http://localhost:6078"
            })
            .Build();

        var result = await new InternalGrpcConfigurationHealthCheck(configuration)
            .CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public async Task HealthCheck_WithMissingApiKeyOrInvalidAddress_ReturnsUnhealthyWithoutSecret()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Grpc:Identity:Address"] = "not-a-url"
            })
            .Build();

        var result = await new InternalGrpcConfigurationHealthCheck(configuration)
            .CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().NotContain("test-key");
        result.Data.Keys.Should().Contain(key => key.Contains("InternalGrpc:ApiKey"));
        result.Data.Keys.Should().Contain(key => key.Contains("Grpc:Identity:Address"));
    }
}
