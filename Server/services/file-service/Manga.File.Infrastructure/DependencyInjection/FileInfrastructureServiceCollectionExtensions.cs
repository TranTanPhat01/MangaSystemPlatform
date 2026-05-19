using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Manga.File.Application.Abstractions;
using Manga.File.Application.Options;
using Manga.File.Application.Services;
using Manga.File.Infrastructure.Persistence;
using Manga.File.Infrastructure.Persistence.Repositories;
using Manga.File.Infrastructure.Services;

namespace Manga.File.Infrastructure.DependencyInjection;

public static class FileInfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddFileInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<FileStorageOptions>(options =>
        {
            options.Provider = configuration["FileStorage:Provider"] ?? "Local";
            options.RootPath = configuration["FileStorage:RootPath"] ?? "storage/files";
            options.MaxFileSizeInMb = int.TryParse(configuration["FileStorage:MaxFileSizeInMb"], out var maxSize) ? maxSize : 20;
            var allowedExtensions = configuration.GetSection("FileStorage:AllowedExtensions")
                .GetChildren()
                .Select(section => section.Value)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!)
                .ToArray();
            options.AllowedExtensions = allowedExtensions.Length > 0
                ? allowedExtensions
                : new[] { ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".psd" };
        });

        services.AddDbContext<FileDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("FileDb")));

        services.AddScoped<IFileAssetRepository, FileAssetRepository>();
        services.AddScoped<IFileUnitOfWork>(provider => provider.GetRequiredService<FileDbContext>());
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        return services;
    }
}
