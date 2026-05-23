using Manga.File.Application.Common;
using Manga.File.Application.DTOs;

namespace Manga.File.Application.Services;

public interface IFileStorageService
{
    Task<Result<StoredFileInfo>> SaveAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        long sizeInBytes,
        CancellationToken cancellationToken = default);

    Task<Result<Stream>> OpenReadAsync(string storagePath, CancellationToken cancellationToken = default);
}
