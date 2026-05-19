using Manga.File.Domain.Entities;

namespace Manga.File.Application.Abstractions;

public interface IFileAssetRepository
{
    Task<FileAsset?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FileAsset>> GetByUploaderAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FileVersion>> GetVersionsAsync(Guid fileAssetId, CancellationToken cancellationToken = default);
    Task<int> GetNextVersionNumberAsync(Guid fileAssetId, CancellationToken cancellationToken = default);
    Task AddAsync(FileAsset fileAsset, CancellationToken cancellationToken = default);
    Task AddVersionAsync(FileVersion fileVersion, CancellationToken cancellationToken = default);
}
