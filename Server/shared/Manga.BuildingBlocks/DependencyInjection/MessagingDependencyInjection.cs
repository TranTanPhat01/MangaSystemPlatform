using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.BuildingBlocks.Messaging;

namespace Manga.BuildingBlocks.DependencyInjection;

public static class MessagingDependencyInjection
{
    public static IServiceCollection AddRabbitMqEventBus(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RabbitMqOptions>(configuration.GetSection("RabbitMQ"));
        services.AddSingleton<IEventBus, RabbitMqEventBus>();
        return services;
    }
}
