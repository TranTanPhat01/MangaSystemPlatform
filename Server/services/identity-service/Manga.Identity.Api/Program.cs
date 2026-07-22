using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Manga.BuildingBlocks.DependencyInjection;
using Manga.BuildingBlocks.Grpc;
using Manga.BuildingBlocks.Health;
using Manga.BuildingBlocks.Authorization;
using Manga.Identity.Api.GrpcServices;
using Manga.Identity.Application.Options;
using Manga.Identity.Application.Services;
using Manga.Identity.Infrastructure.DependencyInjection;
using Manga.Identity.Infrastructure.Persistence;
using Manga.Identity.Infrastructure.Seeding;
using Npgsql;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
{
    configuration.ReadFrom.Configuration(context.Configuration);
});

var jwtOptions = new JwtOptions
{
    Issuer = builder.Configuration["Jwt:Issuer"] ?? string.Empty,
    Audience = builder.Configuration["Jwt:Audience"] ?? string.Empty,
    SecretKey = builder.Configuration["Jwt:SecretKey"] ?? string.Empty,
    AccessTokenExpirationMinutes = GetInt(builder.Configuration, "Jwt:AccessTokenExpirationMinutes", 30),
    RefreshTokenExpirationDays = GetInt(builder.Configuration, "Jwt:RefreshTokenExpirationDays", 7)
};

if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey))
{
    throw new InvalidOperationException("Jwt:SecretKey configuration is missing.");
}

builder.Services.AddControllers();
builder.Services.AddGrpc(options =>
{
    options.Interceptors.Add<InternalGrpcServerInterceptor>();
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Manga Identity API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a valid JWT access token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
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

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserAdminService, UserAdminService>();
builder.Services.AddScoped<IAdminRoleService, AdminRoleService>();
builder.Services.AddScoped<IAdminAuditService, AdminAuditService>();
builder.Services.AddSingleton<InternalGrpcServerInterceptor>();
builder.Services.AddIdentityInfrastructure(builder.Configuration);
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("IdentityDb")!, name: "postgresql")
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
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("EditorialOnly", policy => policy.RequireRole("TantouEditor", "EditorialBoard"));
    options.AddPolicy("MangakaOrAdmin", policy => policy.RequireRole("Mangaka", "Admin"));
});
builder.Services.AddPermissionPolicies();

var app = builder.Build();

await MigrateDatabaseAsync<IdentityDbContext>(
    app.Services,
    app.Logger,
    app.Lifetime.ApplicationStopping);

await using (var scope = app.Services.CreateAsyncScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<IDevelopmentAdminSeeder>();
    await seeder.SeedAsync();
}

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
app.MapGrpcService<IdentityGrpcServiceImpl>();
app.MapHealthChecks("/health", HealthCheckResponseWriter.CreateOptions());

app.Run();

static int GetInt(IConfiguration configuration, string key, int defaultValue)
{
    return int.TryParse(configuration[key], out var value) ? value : defaultValue;
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
            logger.LogWarning(
                "PostgreSQL is not ready for {DbContext}. Retrying migration in {DelaySeconds}s (attempt {Attempt}/{MaxAttempts}).",
                typeof(TContext).Name,
                delay.TotalSeconds,
                attempt,
                maxAttempts);
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
