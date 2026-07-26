using Manga.BuildingBlocks.DependencyInjection;
using Manga.BuildingBlocks.Health;
using Manga.BuildingBlocks.Authorization;
using Manga.BuildingBlocks.Responses;
using Manga.Gateway;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Text;
using System.Diagnostics;
using System.Threading.RateLimiting;
using Serilog;
using Yarp.ReverseProxy.Forwarder;

var builder = WebApplication.CreateBuilder(args);

Activity.DefaultIdFormat = ActivityIdFormat.W3C;
Activity.ForceDefaultIdFormat = true;
GatewayProxyConfiguration.ApplyTimeouts(builder.Configuration);
var maxFileUploadBytes = Math.Clamp(builder.Configuration.GetValue("Gateway:MaxFileUploadBytes", 52_428_800), 1_048_576, 536_870_912);
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = maxFileUploadBytes;
    options.AddServerHeader = false;
});

builder.Host.UseSerilog((context, configuration) =>
{
    configuration.ReadFrom.Configuration(context.Configuration);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(builder.Configuration.GetSection("Gateway:Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000", "http://localhost:3001"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddHttpClient();
var healthCheckTimeoutSeconds = builder.Configuration.GetValue("Gateway:HealthCheckTimeoutSeconds", 3);
builder.Services.AddHttpClient("monitoring", client => client.Timeout = TimeSpan.FromSeconds(healthCheckTimeoutSeconds));
builder.Services.AddSingleton<MonitoringAggregator>();
builder.Services.AddHealthChecks()
    .AddCheck("gateway", () => HealthCheckResult.Healthy("Gateway is running."), tags: ["live", "ready"]);
builder.Services.AddHsts(options => options.MaxAge = TimeSpan.FromDays(Math.Clamp(builder.Configuration.GetValue("Gateway:TransportSecurity:HstsMaxAgeDays", 365), 1, 730)));
builder.Services.AddHttpsRedirection(options =>
{
    var configuredHttpsPort = builder.Configuration.GetValue<int?>("Gateway:TransportSecurity:HttpsPort");
    if (configuredHttpsPort is > 0)
    {
        options.HttpsPort = configuredHttpsPort.Value;
    }
});
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? string.Empty;
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? string.Empty;
var jwtSecret = GatewaySecurity.GetValidatedJwtSecret(builder.Configuration);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true, ValidIssuer = jwtIssuer, ValidAudience = jwtAudience, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)), ClockSkew = TimeSpan.Zero });
builder.Services.AddAuthorization();
builder.Services.AddPermissionPolicies();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("gateway", httpContext =>
    {
        var partitionKey = GatewaySecurity.GetRateLimitPartitionKey(httpContext);
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = builder.Configuration.GetValue("Gateway:RateLimiting:PermitLimit", 300),
            Window = TimeSpan.FromSeconds(Math.Clamp(builder.Configuration.GetValue("Gateway:RateLimiting:WindowSeconds", 60), 1, 3600)),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
});

var otlpEndpoint = builder.Configuration["OpenTelemetry:OtlpEndpoint"] ?? builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
var openTelemetry = builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("Manga.Gateway"));
openTelemetry.WithTracing(tracing =>
{
    tracing.AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation();
    if (Uri.TryCreate(otlpEndpoint, UriKind.Absolute, out var endpoint))
    {
        tracing.AddOtlpExporter(options => options.Endpoint = endpoint);
    }
});
openTelemetry.WithMetrics(metrics =>
{
    metrics.AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation();
    if (Uri.TryCreate(otlpEndpoint, UriKind.Absolute, out var endpoint))
    {
        metrics.AddOtlpExporter(options => options.Endpoint = endpoint);
    }
});

var app = builder.Build();

if (GatewaySecurity.TryBuildForwardedHeadersOptions(builder.Configuration, app.Logger, out var forwardedHeadersOptions))
{
    app.UseForwardedHeaders(forwardedHeadersOptions);
}

if (!app.Environment.IsDevelopment() && builder.Configuration.GetValue("Gateway:TransportSecurity:EnableHttpsRedirection", true))
{
    app.UseHttpsRedirection();
}

if (!app.Environment.IsDevelopment() && builder.Configuration.GetValue("Gateway:TransportSecurity:EnableHsts", true))
{
    app.UseHsts();
}

app.UseMiddleware<GatewayResponseSecurityMiddleware>();
app.UseCorrelationId();
app.UseMangaRequestLogging();
app.UseGlobalExceptionHandling();
app.UseCors("Frontend");
app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapHealthChecks("/health/live", CreateHealthCheckOptions("live"));
app.MapHealthChecks("/health/ready", CreateHealthCheckOptions("ready"));
var monitoring = app.MapGroup("/admin/monitoring").RequireAuthorization(PermissionPolicies.RequireAdminMonitoringRead);
monitoring.MapGet("/overview", async (MonitoringAggregator aggregator, HttpRequest request, CancellationToken cancellationToken) =>
{
    var data = await aggregator.GetOverviewAsync(request.Headers.Authorization, cancellationToken);
    return Results.Ok(ApiResponse<MonitoringOverviewResponse>.Ok(data, "Monitoring overview retrieved successfully"));
});
monitoring.MapGet("/services", async (MonitoringAggregator aggregator, HttpRequest request, CancellationToken cancellationToken) =>
{
    var data = await aggregator.GetServicesAsync(request.Headers.Authorization, cancellationToken);
    return Results.Ok(ApiResponse<IReadOnlyList<ServiceMonitoringResponse>>.Ok(data, "Services status retrieved successfully"));
});
monitoring.MapGet("/outbox-summary", async (MonitoringAggregator aggregator, HttpRequest request, CancellationToken cancellationToken) =>
{
    var data = await aggregator.GetOutboxSummaryAsync(request.Headers.Authorization, cancellationToken);
    return Results.Ok(ApiResponse<OutboxMonitoringResponse>.Ok(data, "Outbox summary retrieved successfully"));
}).RequireAuthorization(PermissionPolicies.RequireAdminOutboxRead);
var servicesHealth = app.MapGet("/health/services", async (IHttpClientFactory httpClientFactory, IConfiguration configuration, CancellationToken cancellationToken) =>
{
    var client = httpClientFactory.CreateClient("monitoring");
    var downstreamStatuses = await Task.WhenAll(ReadDownstreamServices(configuration)
        .Select(async service => new KeyValuePair<string, string>(service.Key, await ReadHealthStatusAsync(client, service.Value, cancellationToken))));
    var services = new Dictionary<string, string>
    {
        ["gateway"] = "Healthy"
    };
    foreach (var service in downstreamStatuses) services[service.Key] = service.Value;

    var statusCode = services.Values.All(status => status == "Healthy")
        ? StatusCodes.Status200OK
        : StatusCodes.Status503ServiceUnavailable;
    return Results.Json(services, statusCode: statusCode);
});
if (!app.Environment.IsDevelopment() && !builder.Configuration.GetValue("Gateway:Health:ExposeServiceDetails", false))
{
    servicesHealth.RequireAuthorization(PermissionPolicies.RequireAdminMonitoringRead);
}

app.MapReverseProxy(proxyPipeline =>
{
    proxyPipeline.Use(async (context, next) =>
    {
        if (context.Request.Path.StartsWithSegments("/files") && context.Request.ContentLength is long contentLength && contentLength > maxFileUploadBytes)
        {
            context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
            await context.Response.WriteAsJsonAsync(new
            {
                code = "REQUEST_TOO_LARGE",
                message = "The uploaded file exceeds the configured size limit.",
                traceId = context.TraceIdentifier
            }, context.RequestAborted);
            return;
        }

        await next();
        var error = context.GetForwarderErrorFeature();
        if (error is null || error.Error == ForwarderError.None || context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = error.Error == ForwarderError.RequestTimedOut
            ? StatusCodes.Status504GatewayTimeout
            : StatusCodes.Status502BadGateway;
        await context.Response.WriteAsJsonAsync(new
        {
            code = error.Error == ForwarderError.RequestTimedOut ? "DOWNSTREAM_TIMEOUT" : "DOWNSTREAM_UNAVAILABLE",
            message = error.Error == ForwarderError.RequestTimedOut
                ? "The requested service did not respond in time."
                : "The requested service is temporarily unavailable.",
            traceId = context.TraceIdentifier
        }, context.RequestAborted);
        context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("Manga.Gateway.Proxy")
            .LogWarning("Proxy failed. Error={ForwarderError}; TraceId={TraceId}", error.Error, context.TraceIdentifier);
    });
}).RequireRateLimiting("gateway");

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

static HealthCheckOptions CreateHealthCheckOptions(string tag) => new()
{
    Predicate = check => check.Tags.Contains(tag),
    ResponseWriter = HealthCheckResponseWriter.CreateOptions().ResponseWriter
};

public partial class Program
{
}
