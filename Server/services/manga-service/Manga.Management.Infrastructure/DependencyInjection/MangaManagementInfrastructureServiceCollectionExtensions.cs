using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.BuildingBlocks.Grpc;
using Manga.Contracts.File.V1;
using Manga.Contracts.Identity.V1;
using Manga.Management.Application.Abstractions;
using Manga.Management.Infrastructure.GrpcClients;
using Manga.Management.Infrastructure.Persistence;
using Manga.Management.Infrastructure.Persistence.Repositories;

namespace Manga.Management.Infrastructure.DependencyInjection;

public static class MangaManagementInfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddMangaManagementInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<MangaManagementDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("MangaDb")));

        services.AddScoped<IManagementRepository, ManagementRepository>();
        services.AddScoped<IManagementUnitOfWork>(provider => provider.GetRequiredService<MangaManagementDbContext>());
        services.AddScoped<IIdentityLookupClient, IdentityGrpcClient>();
        services.AddScoped<IFileLookupClient, FileGrpcClient>();
        services.AddSingleton<InternalGrpcClientInterceptor>();
        services.AddGrpcClient<IdentityGrpcService.IdentityGrpcServiceClient>(options =>
        {
            var address = configuration["Grpc:Identity:Address"] ?? "http://localhost:6207";
            options.Address = new Uri(address);
        }).AddInterceptor<InternalGrpcClientInterceptor>();
        services.AddGrpcClient<FileGrpcService.FileGrpcServiceClient>(options =>
        {
            var address = configuration["Grpc:File:Address"] ?? "http://localhost:6154";
            options.Address = new Uri(address);
        }).AddInterceptor<InternalGrpcClientInterceptor>();

        return services;
    }
}
