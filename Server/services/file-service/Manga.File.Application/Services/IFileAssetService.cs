using Manga.File.Application.Common;
using Manga.File.Application.DTOs;
using Manga.File.Domain.Enums;

namespace Manga.File.Application.Services;

public interface IFileAssetService
{
    Task<Result<FileUploadResponse>> UploadAsync(Stream content, string originalFileName, string contentType, long sizeInBytes, FileCategory category, CancellationToken cancellationToken = default);
    Task<Result<FileAssetResponse>> GetByIdAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<Result<FileDownloadResponse>> DownloadAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<Result<FileUrlResponse>> GetUrlAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<Result<FileVersionResponse>> CreateVersionAsync(Guid fileId, Stream content, string originalFileName, string contentType, long sizeInBytes, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<FileVersionResponse>>> GetVersionsAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<FileAssetResponse>>> GetMineAsync(CancellationToken cancellationToken = default);
}
