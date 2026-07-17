using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Microsoft.OpenApi.Models;
using Manga.BuildingBlocks.DependencyInjection;
using Manga.BuildingBlocks.Grpc;
using Manga.BuildingBlocks.Health;
using Manga.BuildingBlocks.Authorization;
using Manga.Contracts.Events;
using Manga.Management.Api.GrpcServices;
using Manga.Management.Api.Services;
using Manga.Management.Application.EventHandlers;
using Manga.Management.Application.Services;
using Manga.Management.Infrastructure.DependencyInjection;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
{
    configuration.ReadFrom.Configuration(context.Configuration);
});

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? string.Empty;
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? string.Empty;
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? string.Empty;

if (string.IsNullOrWhiteSpace(jwtSecretKey))
{
    throw new InvalidOperationException("Jwt:SecretKey configuration is missing.");
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
builder.Services.AddGrpc(options =>
{
    options.Interceptors.Add<InternalGrpcServerInterceptor>();
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Manga Management API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                    ?? new[] { "http://localhost:3000", "http://localhost:5173" })
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddScoped<IStudioService, StudioService>();
builder.Services.AddScoped<ISeriesService, SeriesService>();
builder.Services.AddScoped<IChapterService, ChapterService>();
builder.Services.AddScoped<IPageService, PageService>();
builder.Services.AddScoped<IAnnotationService, AnnotationService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IManagementAccessService, ManagementAccessService>();
builder.Services.AddSingleton<InternalGrpcServerInterceptor>();
builder.Services.AddMangaManagementInfrastructure(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);
builder.Services.AddRabbitMqConsumer<FileUploadedEvent, FileUploadedEventHandler>("manga-service");
builder.Services.AddRabbitMqConsumer<ChapterApprovedEvent, ChapterApprovedEventHandler>("manga-service");
builder.Services.AddRabbitMqConsumer<ChapterReviewDecisionEvent, ChapterReviewDecisionEventHandler>("manga-service");
builder.Services.AddRabbitMqConsumer<RankingCalculatedEvent, RankingCalculatedEventHandler>("manga-service");
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("MangaDb")!, name: "postgresql")
    .AddRabbitMQ(BuildRabbitMqConnectionString(builder.Configuration), name: "rabbitmq")
    .AddRedis(builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379", name: "redis")
    .AddCheck<InternalGrpcConfigurationHealthCheck>("internal-grpc-config");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddPermissionPolicies();

var app = builder.Build();

await MigrateDatabaseAsync<Manga.Management.Infrastructure.Persistence.MangaManagementDbContext>(
    app.Services,
    app.Logger,
    app.Lifetime.ApplicationStopping);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCorrelationId();
app.UseMangaRequestLogging();
app.UseGlobalExceptionHandling();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGrpcService<MangaManagementGrpcServiceImpl>();
app.MapHealthChecks("/health", HealthCheckResponseWriter.CreateOptions());
app.Run();

static string BuildRabbitMqConnectionString(IConfiguration configuration)
{
    var host = configuration["RabbitMQ:HostName"] ?? "localhost";
    var port = configuration["RabbitMQ:Port"] ?? "5672";
    var userName = Uri.EscapeDataString(configuration["RabbitMQ:UserName"] ?? "guest");
    var password = Uri.EscapeDataString(configuration["RabbitMQ:Password"] ?? "guest");
    return $"amqp://{userName}:{password}@{host}:{port}/";
}

static async Task MigrateDatabaseAsync<TContext>(IServiceProvider services, Microsoft.Extensions.Logging.ILogger logger, CancellationToken cancellationToken)
    where TContext : DbContext
{
    const int maxAttempts = 12;
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            await using var scope = services.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TContext>();
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(cancellationToken);
            logger.LogInformation(
                "Applying {PendingMigrationCount} pending migrations for {DbContext}: {PendingMigrations}.",
                pendingMigrations.Count(),
                typeof(TContext).Name,
                string.Join(", ", pendingMigrations));
            await dbContext.Database.MigrateAsync(cancellationToken);
            logger.LogInformation("Database migrations completed for {DbContext}.", typeof(TContext).Name);
            return;
        }
        catch (Exception exception) when (IsDatabaseUnavailable(exception) && attempt < maxAttempts)
        {
            var delay = TimeSpan.FromSeconds(Math.Min(attempt * 2, 10));
            logger.LogWarning("PostgreSQL is not ready for {DbContext}. Retrying migration in {DelaySeconds}s (attempt {Attempt}/{MaxAttempts}).", typeof(TContext).Name, delay.TotalSeconds, attempt, maxAttempts);
            await Task.Delay(delay, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogCritical(exception, "Database migration failed for {DbContext}. Application startup is aborted.", typeof(TContext).Name);
            throw;
        }
    }
}

static bool IsDatabaseUnavailable(Exception exception) =>
    exception is NpgsqlException and not PostgresException;
