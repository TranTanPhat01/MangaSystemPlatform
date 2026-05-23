using Microsoft.EntityFrameworkCore;
using Manga.File.Application.Abstractions;
using Manga.File.Domain.Entities;

namespace Manga.File.Infrastructure.Persistence;

public sealed class FileDbContext : DbContext, IFileUnitOfWork
{
    public FileDbContext(DbContextOptions<FileDbContext> options)
        : base(options)
    {
    }

    public DbSet<FileAsset> FileAssets => Set<FileAsset>();
    public DbSet<FileVersion> FileVersions => Set<FileVersion>();
    public DbSet<Thumbnail> Thumbnails => Set<Thumbnail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FileDbContext).Assembly);
    }
}
