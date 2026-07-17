using System.Diagnostics;
using System.Text.Json;

namespace Manga.Gateway;

public sealed class MonitoringAggregator(IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    private static readonly DateTime StartedAt = DateTime.UtcNow;
    private static readonly string[] ServiceNames = ["Gateway", "Identity API", "Manga API", "File API", "Editorial API", "Notification API"];

    public async Task<IReadOnlyList<ServiceMonitoringResponse>> GetServicesAsync(string? authorization, CancellationToken cancellationToken)
    {
        var services = new List<ServiceMonitoringResponse>
        {
            new("Gateway", "Healthy", Version(), Build(), DateTime.UtcNow, (long)(DateTime.UtcNow - StartedAt).TotalSeconds, [], [], null, null)
        };
        foreach (var service in Downstreams()) services.Add(await ReadServiceAsync(service, authorization, cancellationToken));
        return services;
    }

    public async Task<OutboxMonitoringResponse> GetOutboxSummaryAsync(string? authorization, CancellationToken cancellationToken)
    {
        var summaries = new List<OutboxServiceSummary>();
        foreach (var service in Downstreams().Where(service => service.Outbox))
            summaries.Add(await ReadOutboxAsync(service, authorization, cancellationToken));
        return new OutboxMonitoringResponse(summaries.Sum(summary => summary.Pending), summaries.Sum(summary => summary.Failed), summaries);
    }

    public async Task<MonitoringOverviewResponse> GetOverviewAsync(string? authorization, CancellationToken cancellationToken)
    {
        var services = await GetServicesAsync(authorization, cancellationToken);
        var outbox = await GetOutboxSummaryAsync(authorization, cancellationToken);
        var outboxByService = outbox.Services.ToDictionary(summary => $"{summary.Service} API", StringComparer.OrdinalIgnoreCase);
        services = services.Select(service => outboxByService.TryGetValue(service.Name, out var summary) ? service with { Outbox = summary } : service).ToArray();
        var unhealthy = services.Count(service => service.Status != "Healthy");
        var status = unhealthy == 0 ? "Healthy" : "Degraded";
        return new MonitoringOverviewResponse(status, DateTime.UtcNow,
            configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production",
            new MonitoringSummary(services.Count(service => service.Status == "Healthy"), services.Count, outbox.TotalFailed, outbox.TotalPending, unhealthy, 0), services, outbox);
    }

    public static IReadOnlyCollection<string> ExpectedServiceNames => ServiceNames;

    private async Task<ServiceMonitoringResponse> ReadServiceAsync(Downstream service, string? authorization, CancellationToken cancellationToken)
    {
        var checkedAt = DateTime.UtcNow;
        try
        {
            using var response = await RequestAsync(new Uri(new Uri(service.Address), "health"), authorization, cancellationToken);
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var status = response.IsSuccessStatusCode && document.RootElement.TryGetProperty("status", out var healthStatus) ? healthStatus.GetString() ?? "Unhealthy" : "Unhealthy";
            var dependencies = new List<DependencyMonitoringResponse>();
            if (document.RootElement.TryGetProperty("entries", out var entries))
            {
                foreach (var entry in entries.EnumerateObject())
                {
                    var entryStatus = entry.Value.TryGetProperty("status", out var value) ? value.GetString() ?? "Unknown" : "Unknown";
                    var latency = entry.Value.TryGetProperty("duration", out var duration) && duration.TryGetDouble(out var milliseconds) ? (long?)milliseconds : null;
                    dependencies.Add(new DependencyMonitoringResponse(entry.Name, DependencyType(entry.Name), entryStatus, latency));
                }
            }
            return new ServiceMonitoringResponse(service.Name, status, Version(), Build(), checkedAt, null, dependencies, [], null, null);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException or JsonException)
        {
            return new ServiceMonitoringResponse(service.Name, "Unhealthy", Version(), Build(), checkedAt, null, [], ["Health endpoint unavailable"], "Downstream unavailable", null);
        }
    }

    private async Task<OutboxServiceSummary> ReadOutboxAsync(Downstream service, string? authorization, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await RequestAsync(new Uri(new Uri(service.Address), "admin/outbox/summary"), authorization, cancellationToken);
            if (!response.IsSuccessStatusCode) return new OutboxServiceSummary(service.ShortName, 0, 0, 0, null);
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var root = document.RootElement;
            return new OutboxServiceSummary(service.ShortName, Number(root, "pending"), Number(root, "failed"), Number(root, "publishedLast24h"), Timestamp(root, "lastFailedAt"));
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException or JsonException)
        {
            return new OutboxServiceSummary(service.ShortName, 0, 0, 0, null);
        }
    }

    private Task<HttpResponseMessage> RequestAsync(Uri uri, string? authorization, CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, uri);
        if (!string.IsNullOrWhiteSpace(authorization)) request.Headers.TryAddWithoutValidation("Authorization", authorization);
        return httpClientFactory.CreateClient("monitoring").SendAsync(request, cancellationToken);
    }

    private IEnumerable<Downstream> Downstreams() =>
    [
        new("Identity API", "Identity", Address("identity-cluster", "identity-api", "http://localhost:5207/"), false),
        new("Manga API", "Manga", Address("manga-cluster", "manga-api", "http://localhost:5078/"), true),
        new("File API", "File", Address("files-cluster", "file-api", "http://localhost:5154/"), true),
        new("Editorial API", "Editorial", Address("editorial-cluster", "editorial-api", "http://localhost:5206/"), true),
        new("Notification API", "Notification", Address("notifications-cluster", "notification-api", "http://localhost:5210/"), false)
    ];

    private string Address(string cluster, string destination, string fallback) => configuration[$"ReverseProxy:Clusters:{cluster}:Destinations:{destination}:Address"] ?? fallback;
    private string Version() => configuration["App:Version"] ?? "local";
    private string Build() => configuration["App:Build"] ?? "unknown";
    private static int Number(JsonElement root, string name) => root.TryGetProperty(name, out var value) && value.TryGetInt32(out var number) ? number : 0;
    private static DateTime? Timestamp(JsonElement root, string name) => root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String && value.TryGetDateTime(out var timestamp) ? timestamp : null;
    private static string DependencyType(string name) => name.Contains("postgres", StringComparison.OrdinalIgnoreCase) ? "PostgreSQL" : name.Contains("rabbit", StringComparison.OrdinalIgnoreCase) ? "MessageBroker" : name.Contains("minio", StringComparison.OrdinalIgnoreCase) ? "ObjectStorage" : name.Contains("redis", StringComparison.OrdinalIgnoreCase) ? "Cache" : "Runtime";
    private sealed record Downstream(string Name, string ShortName, string Address, bool Outbox);
}

public sealed record DependencyMonitoringResponse(string Name, string Type, string Status, long? LatencyMs);
public sealed record ServiceMonitoringResponse(string Name, string Status, string Version, string Build, DateTime CheckedAt, long? UptimeSeconds, IReadOnlyCollection<DependencyMonitoringResponse> Dependencies, IReadOnlyCollection<string> Warnings, string? SafeErrorSummary, OutboxServiceSummary? Outbox);
public sealed record OutboxServiceSummary(string Service, int Pending, int Failed, int PublishedLast24h, DateTime? LastFailedAt);
public sealed record OutboxMonitoringResponse(int TotalPending, int TotalFailed, IReadOnlyCollection<OutboxServiceSummary> Services);
public sealed record MonitoringSummary(int HealthyServices, int TotalServices, int TotalFailedOutbox, int TotalPendingOutbox, int CriticalAlerts, int WarningAlerts);
public sealed record MonitoringOverviewResponse(string Status, DateTime CheckedAt, string Environment, MonitoringSummary Summary, IReadOnlyCollection<ServiceMonitoringResponse> Services, OutboxMonitoringResponse Outbox);
