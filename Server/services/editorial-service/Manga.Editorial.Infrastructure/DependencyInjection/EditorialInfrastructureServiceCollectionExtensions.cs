using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.BuildingBlocks.Grpc;
using Manga.Contracts.Management.V1;
using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Infrastructure.GrpcClients;
using Manga.Editorial.Infrastructure.Persistence;
using Manga.Editorial.Infrastructure.Persistence.Repositories;

namespace Manga.Editorial.Infrastructure.DependencyInjection;

public static class EditorialInfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddEditorialInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<EditorialDbContext>(options => options.UseNpgsql(configuration.GetConnectionString("EditorialDb")));
        services.AddScoped<IEditorialRepository, EditorialRepository>();
        services.AddScoped<IEditorialUnitOfWork>(provider => provider.GetRequiredService<EditorialDbContext>());
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
