using System.Net;
using FluentAssertions;
using Manga.Gateway;
using Microsoft.Extensions.Configuration;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class MonitoringAggregatorTests
{
    [Fact]
    public async Task UnavailableDownstream_ReturnsDegradedOverviewWithoutSensitiveDetails()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ReverseProxy:Clusters:identity-cluster:Destinations:identity-api:Address"] = "http://unavailable/",
            ["ReverseProxy:Clusters:manga-cluster:Destinations:manga-api:Address"] = "http://unavailable/",
            ["ReverseProxy:Clusters:files-cluster:Destinations:file-api:Address"] = "http://unavailable/",
            ["ReverseProxy:Clusters:editorial-cluster:Destinations:editorial-api:Address"] = "http://unavailable/",
            ["ReverseProxy:Clusters:notifications-cluster:Destinations:notification-api:Address"] = "http://unavailable/"
        }).Build();
        var aggregator = new MonitoringAggregator(new FailingHttpClientFactory(), configuration);

        var overview = await aggregator.GetOverviewAsync(null, CancellationToken.None);

        overview.Status.Should().Be("Degraded");
        overview.Services.Select(service => service.Name).Should().Contain(MonitoringAggregator.ExpectedServiceNames);
        System.Text.Json.JsonSerializer.Serialize(overview).Should().NotContainAny("password", "secret", "connectionstring", "payload", "token");
    }

    private sealed class FailingHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(new FailingHandler()) { Timeout = TimeSpan.FromMilliseconds(100) };
    }

    private sealed class FailingHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            throw new HttpRequestException("downstream unavailable");
    }
}
