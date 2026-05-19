using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.Management.Application.Abstractions;
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

        return services;
    }
}
