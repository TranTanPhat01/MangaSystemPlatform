using Manga.BuildingBlocks.DependencyInjection;
using Manga.BuildingBlocks.Health;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
{
    configuration.ReadFrom.Configuration(context.Configuration);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddHttpClient();
builder.Services.AddHealthChecks()
    .AddCheck("gateway", () => HealthCheckResult.Healthy("Gateway is running."));

var app = builder.Build();

app.UseCorrelationId();
app.UseMangaRequestLogging();
app.UseGlobalExceptionHandling();
app.UseCors("Frontend");

app.MapGet("/gateway/health", () => Results.Text("Gateway is running"));
app.MapHealthChecks("/health", HealthCheckResponseWriter.CreateOptions());
app.MapGet("/health/services", async (IHttpClientFactory httpClientFactory, IConfiguration configuration, CancellationToken cancellationToken) =>
{
    var client = httpClientFactory.CreateClient();
    var services = new Dictionary<string, string>
    {
        ["gateway"] = "Healthy"
    };

    foreach (var service in ReadDownstreamServices(configuration))
    {
        services[service.Key] = await ReadHealthStatusAsync(client, service.Value, cancellationToken);
    }

    return Results.Json(services);
});

app.MapReverseProxy();

app.Run();

static IReadOnlyDictionary<string, string> ReadDownstreamServices(IConfiguration configuration)
{
    return new Dictionary<string, string>
    {
        ["identity"] = configuration["ReverseProxy:Clusters:identity-cluster:Destinations:identity-api:Address"] ?? "http://localhost:5207/",
        ["manga"] = configuration["ReverseProxy:Clusters:manga-cluster:Destinations:manga-api:Address"] ?? "http://localhost:5078/",
        ["file"] = configuration["ReverseProxy:Clusters:files-cluster:Destinations:file-api:Address"] ?? "http://localhost:5154/",
        ["editorial"] = configuration["ReverseProxy:Clusters:editorial-cluster:Destinations:editorial-api:Address"] ?? "http://localhost:5206/",
        ["notification"] = configuration["ReverseProxy:Clusters:notifications-cluster:Destinations:notification-api:Address"] ?? "http://localhost:5210/"
    };
}

static async Task<string> ReadHealthStatusAsync(HttpClient client, string serviceAddress, CancellationToken cancellationToken)
{
    try
    {
        var healthUri = new Uri(new Uri(serviceAddress), "health");
        using var response = await client.GetAsync(healthUri, cancellationToken);
        return response.IsSuccessStatusCode ? "Healthy" : "Unhealthy";
    }
    catch
    {
        return "Unhealthy";
    }
}
