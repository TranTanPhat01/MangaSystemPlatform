using System.Text;
using Manga.BuildingBlocks.DependencyInjection;
using Manga.Contracts.Events;
using Manga.Notification.Api.Services;
using Manga.Notification.Application.EventHandlers;
using Manga.Notification.Application.Services;
using Manga.Notification.Infrastructure.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var issuer = builder.Configuration["Jwt:Issuer"] ?? string.Empty;
var audience = builder.Configuration["Jwt:Audience"] ?? string.Empty;
var secret = builder.Configuration["Jwt:SecretKey"] ?? string.Empty;

if (string.IsNullOrWhiteSpace(secret))
{
    throw new InvalidOperationException("Jwt:SecretKey configuration is missing.");
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
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
builder.Services.AddNotificationInfrastructure(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);
builder.Services.AddRabbitMqConsumer<TaskAssignedEvent, TaskAssignedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<TaskSubmittedEvent, TaskSubmittedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<TaskApprovedEvent, TaskApprovedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<ChapterSubmittedForReviewEvent, ChapterSubmittedForReviewEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<ChapterApprovedEvent, ChapterApprovedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<RankingCalculatedEvent, RankingCalculatedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<CancellationWarningCreatedEvent, CancellationWarningCreatedEventHandler>("notification-service");
builder.Services.AddRabbitMqConsumer<FileUploadedEvent, FileUploadedEventHandler>("notification-service");

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
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseGlobalExceptionHandling();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
