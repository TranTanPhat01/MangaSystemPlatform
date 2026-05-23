using Manga.Notification.Application.Abstractions;
using Manga.Notification.Infrastructure.Persistence;
using Manga.Notification.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Manga.Notification.Infrastructure.DependencyInjection;

public static class NotificationInfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddNotificationInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<NotificationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("NotificationDb")));

        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationUnitOfWork>(provider => provider.GetRequiredService<NotificationDbContext>());

        return services;
    }
}
