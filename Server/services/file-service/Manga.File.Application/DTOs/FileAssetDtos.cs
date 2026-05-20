using Manga.File.Domain.Enums;

namespace Manga.File.Application.DTOs;

public sealed class FileUploadResponse
{
    public Guid FileId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public FileCategory FileCategory { get; set; }
    public string? PublicUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class FileAssetResponse
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public StorageProvider StorageProvider { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public Guid UploadedByUserId { get; set; }
    public FileCategory FileCategory { get; set; }
    public FileStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class FileVersionResponse
{
    public Guid Id { get; set; }
    public Guid FileAssetId { get; set; }
    public int VersionNumber { get; set; }
    public string StoredFileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
}

public sealed class CreateFileVersionRequest
{
    public string? Note { get; set; }
}

public sealed class FileUrlResponse
{
    public Guid FileId { get; set; }
    public string? PublicUrl { get; set; }
    public string StoragePath { get; set; } = string.Empty;
}

public sealed class FileDownloadResponse
{
    public Stream Content { get; set; } = Stream.Null;
    public string ContentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}
