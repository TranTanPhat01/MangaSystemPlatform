using Manga.File.Domain.Enums;

namespace Manga.File.Domain.Entities;

public sealed class FileAsset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public StorageProvider StorageProvider { get; set; } = StorageProvider.Local;
    public string StoragePath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public Guid UploadedByUserId { get; set; }
    public FileCategory FileCategory { get; set; }
    public FileStatus Status { get; set; } = FileStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<FileVersion> Versions { get; set; } = new List<FileVersion>();
    public ICollection<Thumbnail> Thumbnails { get; set; } = new List<Thumbnail>();
}
