using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.BuildingBlocks.Grpc;
using Manga.Contracts.Management.V1;
using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Infrastructure.GrpcClients;
using Manga.Editorial.Infrastructure.Persistence;
using Manga.Editorial.Infrastructure.Persistence.Repositories;
using Manga.BuildingBlocks.Messaging;

namespace Manga.Editorial.Infrastructure.DependencyInjection;

public static class EditorialInfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddEditorialInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<EditorialDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("EditorialDb")));
        services.AddScoped<IEditorialRepository, EditorialRepository>();
        services.AddScoped<IEditorialUnitOfWork>(provider => provider.GetRequiredService<EditorialDbContext>());
        services.AddScoped<EditorialOutboxStore>();
        services.AddScoped<IOutboxStore>(provider => provider.GetRequiredService<EditorialOutboxStore>());
        services.AddScoped<IOutboxOperations>(provider => provider.GetRequiredService<EditorialOutboxStore>());
        services.AddScoped<Manga.BuildingBlocks.Messaging.IEventBus, OutboxEventBus>();
        services.Configure<OutboxOptions>(configuration.GetSection("Outbox"));
        services.AddHostedService<OutboxProcessor>();
        services.AddScoped<IMangaLookupClient, MangaGrpcClient>();
        services.AddSingleton<InternalGrpcClientInterceptor>();
        services.AddGrpcClient<MangaManagementGrpcService.MangaManagementGrpcServiceClient>(options =>
        {
            var address = configuration["Grpc:Manga:Address"] ?? "http://localhost:6078";
            options.Address = new Uri(address);
        }).AddInterceptor<InternalGrpcClientInterceptor>();
        return services;
    }
}
