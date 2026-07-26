using System.Text;
using Manga.BuildingBlocks.DependencyInjection;
using Manga.BuildingBlocks.Health;
using Manga.BuildingBlocks.Authorization;
using Manga.Contracts.Events;
using Manga.Notification.Api.Hubs;
using Manga.Notification.Api.Services;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Application.EventHandlers;
using Manga.Notification.Application.Services;
using Manga.Notification.Infrastructure.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Microsoft.EntityFrameworkCore;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
{
    configuration.ReadFrom.Configuration(context.Configuration);
});

var issuer = builder.Configuration["Jwt:Issuer"] ?? string.Empty;
var audience = builder.Configuration["Jwt:Audience"] ?? string.Empty;
var secret = builder.Configuration["Jwt:SecretKey"] ?? string.Empty;

if (string.IsNullOrWhiteSpace(secret))
{
    throw new InvalidOperationException("Jwt:SecretKey configuration is missing.");
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Manga Notification API", Version = "v1" });
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

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationRealtimePublisher, SignalRNotificationRealtimePublisher>();
builder.Services.AddNotificationInfrastructure(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);
builder.Services.AddRabbitMqConsumer<TaskAssignedEvent, TaskAssignedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<TaskSubmittedEvent, TaskSubmittedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<TaskApprovedEvent, TaskApprovedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<ChapterSubmittedForReviewEvent, ChapterSubmittedForReviewEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<ChapterApprovedEvent, ChapterApprovedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<ChapterReviewDecisionEvent, ChapterReviewDecisionEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<SeriesProposalDecidedEvent, SeriesProposalDecidedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<ProposalSubmittedEvent, ProposalSubmittedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<RankingCalculatedEvent, RankingCalculatedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<CancellationWarningCreatedEvent, CancellationWarningCreatedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<FileUploadedEvent, FileUploadedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<ReaderChapterNotificationRequestedEvent, ReaderChapterNotificationRequestedEventHandler>("notification-service");
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("NotificationDb")!, name: "postgresql")
    .AddRabbitMQ(BuildRabbitMqConnectionString(builder.Configuration), name: "rabbitmq");

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
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/notifications/hub"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddPermissionPolicies();

var app = builder.Build();

await MigrateDatabaseAsync<Manga.Notification.Infrastructure.Persistence.NotificationDbContext>(
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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/notifications/hub");
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
