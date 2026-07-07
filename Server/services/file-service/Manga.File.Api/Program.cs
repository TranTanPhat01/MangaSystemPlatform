using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Manga.BuildingBlocks.DependencyInjection;
using Manga.BuildingBlocks.Grpc;
using Manga.BuildingBlocks.Health;
using Manga.File.Api.GrpcServices;
using Manga.File.Api.Services;
using Manga.File.Application.Services;
using Manga.File.Infrastructure.DependencyInjection;
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
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Manga File API", Version = "v1" });
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
builder.Services.AddScoped<IFileAssetService, FileAssetService>();
builder.Services.AddSingleton<InternalGrpcServerInterceptor>();
builder.Services.AddFileInfrastructure(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);
builder.Services.AddHttpClient();
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("FileDb")!, name: "postgresql")
    .AddRabbitMQ(BuildRabbitMqConnectionString(builder.Configuration), name: "rabbitmq")
    .AddCheck<MinioHealthCheck>("minio")
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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCorrelationId();
app.UseMangaRequestLogging();
app.UseGlobalExceptionHandling();

var storageRoot = Path.GetFullPath(Path.Combine(
    Directory.GetCurrentDirectory(),
    builder.Configuration["FileStorage:RootPath"] ?? "storage/files"));
Directory.CreateDirectory(storageRoot);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(storageRoot),
    RequestPath = "/files/static"
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGrpcService<FileGrpcServiceImpl>();
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
