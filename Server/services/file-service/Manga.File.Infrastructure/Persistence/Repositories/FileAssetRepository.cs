using Microsoft.EntityFrameworkCore;
using Manga.File.Application.Abstractions;
using Manga.File.Domain.Entities;
using Manga.File.Domain.Enums;

namespace Manga.File.Infrastructure.Persistence.Repositories;

internal sealed class FileAssetRepository : IFileAssetRepository
{
    private readonly FileDbContext _dbContext;

    public FileAssetRepository(FileDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<FileAsset?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.FileAssets.FirstOrDefaultAsync(file => file.Id == id, cancellationToken);

    public async Task<IReadOnlyList<FileAsset>> GetByUploaderAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _dbContext.FileAssets
            .Where(file => file.UploadedByUserId == userId && file.Status == FileStatus.Active)
            .OrderByDescending(file => file.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<FileVersion>> GetVersionsAsync(Guid fileAssetId, CancellationToken cancellationToken = default) =>
        await _dbContext.FileVersions
            .Where(version => version.FileAssetId == fileAssetId)
            .OrderByDescending(version => version.VersionNumber)
            .ToListAsync(cancellationToken);

    public async Task<int> GetNextVersionNumberAsync(Guid fileAssetId, CancellationToken cancellationToken = default)
    {
        var latestVersion = await _dbContext.FileVersions
            .Where(version => version.FileAssetId == fileAssetId)
            .MaxAsync(version => (int?)version.VersionNumber, cancellationToken);

        return (latestVersion ?? 0) + 1;
    }

    public async Task AddAsync(FileAsset fileAsset, CancellationToken cancellationToken = default)
    {
        await _dbContext.FileAssets.AddAsync(fileAsset, cancellationToken);
    }

    public async Task AddVersionAsync(FileVersion fileVersion, CancellationToken cancellationToken = default)
    {
        await _dbContext.FileVersions.AddAsync(fileVersion, cancellationToken);
    }
}
