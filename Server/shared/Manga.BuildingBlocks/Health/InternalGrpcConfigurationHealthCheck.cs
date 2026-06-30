using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Manga.BuildingBlocks.Health;

public sealed class InternalGrpcConfigurationHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;

    public InternalGrpcConfigurationHealthCheck(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var failures = new List<string>();

        if (string.IsNullOrWhiteSpace(_configuration["InternalGrpc:ApiKey"]))
        {
            failures.Add("InternalGrpc:ApiKey is missing.");
        }

        var grpcSection = _configuration.GetSection("Grpc");
        foreach (var serviceSection in grpcSection.GetChildren())
        {
            var address = serviceSection["Address"];
            if (string.IsNullOrWhiteSpace(address))
            {
                failures.Add($"Grpc:{serviceSection.Key}:Address is missing.");
                continue;
            }

            if (!Uri.TryCreate(address, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                failures.Add($"Grpc:{serviceSection.Key}:Address is invalid.");
            }
        }

        return Task.FromResult(failures.Count == 0
            ? HealthCheckResult.Healthy("Internal gRPC configuration is valid.")
            : HealthCheckResult.Unhealthy("Internal gRPC configuration is invalid.", data: failures.ToDictionary(
                failure => failure,
                failure => (object)"invalid")));
    }
}
