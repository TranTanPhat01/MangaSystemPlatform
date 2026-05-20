using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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

    public static IServiceCollection AddRabbitMqConsumer<TEvent, THandler>(
        this IServiceCollection services,
        string serviceName)
        where TEvent : class
        where THandler : class, IIntegrationEventHandler<TEvent>
    {
        services.AddScoped<THandler>();
        services.AddSingleton<IHostedService>(serviceProvider =>
            ActivatorUtilities.CreateInstance<RabbitMqEventConsumer<TEvent, THandler>>(serviceProvider, serviceName));

        return services;
    }
}
