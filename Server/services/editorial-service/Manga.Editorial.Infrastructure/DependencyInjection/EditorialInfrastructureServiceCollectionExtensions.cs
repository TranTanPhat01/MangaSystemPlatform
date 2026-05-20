using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.Editorial.Application.Abstractions;
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
        return services;
    }
}
