namespace Manga.File.Domain.Entities;

public sealed class FileVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FileAssetId { get; set; }
    public FileAsset? FileAsset { get; set; }
    public int VersionNumber { get; set; }
    public string StoredFileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedByUserId { get; set; }
}
