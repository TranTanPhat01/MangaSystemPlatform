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
        var fileStorageSection = configuration.GetSection("FileStorage");
        var storageSection = configuration.GetSection("Storage");
        var minioSection = configuration.GetSection("MinIO");

        services.Configure<FileStorageOptions>(options =>
        {
            options.Provider = storageSection["Provider"] ?? fileStorageSection["Provider"] ?? "Local";
            options.MaxFileSizeInMb = int.TryParse(storageSection["MaxFileSizeInMb"] ?? fileStorageSection["MaxFileSizeInMb"], out var maxSize) ? maxSize : 20;

            var allowedExtensions = (storageSection.GetSection("AllowedExtensions").GetChildren().Any() 
                ? storageSection.GetSection("AllowedExtensions") 
                : fileStorageSection.GetSection("AllowedExtensions"))
                .GetChildren()
                .Select(section => section.Value)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!)
                .ToArray();

            options.AllowedExtensions = allowedExtensions.Length > 0
                ? allowedExtensions
                : new[] { ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".psd" };

            options.Local.RootPath = storageSection["Local:RootPath"] ?? fileStorageSection["RootPath"] ?? "storage/files";
            options.RootPath = options.Local.RootPath; // Compatibility

            options.Minio.Endpoint = storageSection["Minio:Endpoint"] ?? minioSection["Endpoint"] ?? "localhost:9000";
            options.Minio.AccessKey = storageSection["Minio:AccessKey"] ?? minioSection["AccessKey"] ?? "minioadmin";
            options.Minio.SecretKey = storageSection["Minio:SecretKey"] ?? minioSection["SecretKey"] ?? "minioadmin";
            options.Minio.Bucket = storageSection["Minio:Bucket"] ?? minioSection["BucketName"] ?? "manga-files";
            
            if (bool.TryParse(storageSection["Minio:UseSSL"] ?? minioSection["UseSSL"], out var useSsl))
            {
                options.Minio.UseSSL = useSsl;
            }
            else
            {
                options.Minio.UseSSL = false;
            }

            options.Minio.PublicBaseUrl = storageSection["Minio:PublicBaseUrl"] ?? $"{(options.Minio.UseSSL ? "https" : "http")}://{options.Minio.Endpoint}";
        });

        services.AddDbContext<FileDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("FileDb")));

        services.AddScoped<IFileAssetRepository, FileAssetRepository>();
        services.AddScoped<IFileUnitOfWork>(provider => provider.GetRequiredService<FileDbContext>());

        var providerType = storageSection["Provider"] ?? fileStorageSection["Provider"] ?? "Local";
        if (providerType.Equals("Minio", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IFileStorageService, MinioFileStorageService>();
            Console.WriteLine("File storage provider selected: Minio");
        }
        else
        {
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
            Console.WriteLine("File storage provider selected: Local");
        }

        return services;
    }
}
