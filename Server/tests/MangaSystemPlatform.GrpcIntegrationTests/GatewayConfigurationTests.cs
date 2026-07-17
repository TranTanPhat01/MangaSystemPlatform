using System.Text.Json;
using FluentAssertions;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class GatewayConfigurationTests
{
    [Fact]
    public void RequiredRoutes_MapToExpectedClusters_PreservePrefixes_AndRemoveCookiesOnly()
    {
        using var document = LoadGatewayConfig();
        var routes = document.RootElement.GetProperty("ReverseProxy").GetProperty("Routes");
        AssertRoute(routes, "identity-route", "/identity/{**catch-all}", "identity-cluster");
        AssertRoute(routes, "manga-route", "/manga/{**catch-all}", "manga-cluster");
        AssertRoute(routes, "files-route", "/files/{**catch-all}", "files-cluster");
        AssertRoute(routes, "editorial-route", "/editorial/{**catch-all}", "editorial-cluster");
        AssertRoute(routes, "notifications-route", "/notifications/{**catch-all}", "notifications-cluster");
        document.RootElement.GetRawText().Should().NotContain("Authorization");
        document.RootElement.GetRawText().Should().NotContain("PathRemovePrefix");
        routes.GetProperty("identity-route").GetProperty("Transforms")[0].GetProperty("RequestHeaderRemove").GetString().Should().Be("Cookie");
    }

    [Fact]
    public void DevelopmentDestinations_AreLocal_AndBaseDestinations_AreDockerServiceNames()
    {
        using var baseConfig = LoadGatewayConfig();
        using var developmentConfig = JsonDocument.Parse(File.ReadAllText(Path.Combine(GatewayDirectory(), "appsettings.Development.json")));
        var baseAddress = baseConfig.RootElement.GetProperty("ReverseProxy").GetProperty("Clusters").GetProperty("identity-cluster").GetProperty("Destinations").GetProperty("identity-api").GetProperty("Address").GetString();
        var developmentAddress = developmentConfig.RootElement.GetProperty("ReverseProxy").GetProperty("Clusters").GetProperty("identity-cluster").GetProperty("Destinations").GetProperty("identity-api").GetProperty("Address").GetString();
        baseAddress.Should().Be("http://identity-api:8080/");
        developmentAddress.Should().Be("http://localhost:5207/");
    }

    [Fact]
    public void Gateway_ExposesHealthAndValidFrontendCors_AndNotificationHubIsCovered()
    {
        var program = File.ReadAllText(Path.Combine(GatewayDirectory(), "Program.cs"));
        program.Should().Contain("MapHealthChecks(\"/health/live\"");
        program.Should().Contain("MapHealthChecks(\"/health/ready\"");
        program.Should().Contain("MapGet(\"/health/services\"");
        program.Should().Contain("CreateClient(\"monitoring\")");
        program.Should().Contain("Task.WhenAll");
        program.Should().Contain("UseWebSockets()");
        program.Should().Contain("DOWNSTREAM_UNAVAILABLE");
        program.Should().Contain("DOWNSTREAM_TIMEOUT");
        program.Should().Contain("RequireRateLimiting(\"gateway\")");
        program.Should().Contain("UseForwardedHeaders");
        program.Should().Contain("GatewayResponseSecurityMiddleware");
        program.Should().Contain("AddOpenTelemetry");
        program.Should().Contain("http://localhost:3000");
        program.Should().Contain("http://localhost:3001");
        program.Should().Contain("AllowCredentials()");
        program.Should().NotContain("AllowAnyOrigin()");
        using var document = LoadGatewayConfig();
        document.RootElement.GetProperty("ReverseProxy").GetProperty("Routes").GetProperty("notifications-route").GetProperty("Match").GetProperty("Path").GetString().Should().Be("/notifications/{**catch-all}");
        document.RootElement.GetProperty("Gateway").GetProperty("HealthCheckTimeoutSeconds").GetInt32().Should().Be(3);
    }

    private static void AssertRoute(JsonElement routes, string routeId, string path, string cluster) { var route = routes.GetProperty(routeId); route.GetProperty("ClusterId").GetString().Should().Be(cluster); route.GetProperty("Match").GetProperty("Path").GetString().Should().Be(path); }
    private static JsonDocument LoadGatewayConfig() => JsonDocument.Parse(File.ReadAllText(Path.Combine(GatewayDirectory(), "appsettings.json")));
    private static string GatewayDirectory()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "MangaSystemPlatform.Server.sln"))) directory = directory.Parent;
        return Path.Combine(directory?.FullName ?? throw new DirectoryNotFoundException("Server solution root was not found."), "gateway", "Manga.Gateway");
    }
}
