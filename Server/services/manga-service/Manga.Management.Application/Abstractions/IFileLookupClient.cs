using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Abstractions;

public interface IFileLookupClient
{
    Task<bool> FileExistsAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<FileMetadataDto?> GetFileMetadataAsync(Guid fileId, CancellationToken cancellationToken = default);
}
