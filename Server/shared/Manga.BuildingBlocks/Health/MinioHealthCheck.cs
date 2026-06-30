using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Manga.BuildingBlocks.Health;

public sealed class MinioHealthCheck : IHealthCheck
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public MinioHealthCheck(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var endpoint = _configuration["MinIO:Endpoint"] ?? "localhost:9000";
        var useSsl = bool.TryParse(_configuration["MinIO:UseSSL"], out var parsedUseSsl) && parsedUseSsl;
        var scheme = useSsl ? "https" : "http";
        var uri = new Uri($"{scheme}://{endpoint.TrimEnd('/')}/minio/health/live");

        try
        {
            using var client = _httpClientFactory.CreateClient(nameof(MinioHealthCheck));
            using var response = await client.GetAsync(uri, cancellationToken);

            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("MinIO is healthy.")
                : HealthCheckResult.Unhealthy($"MinIO returned {(int)response.StatusCode}.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("MinIO health check failed.", exception);
        }
    }
}
