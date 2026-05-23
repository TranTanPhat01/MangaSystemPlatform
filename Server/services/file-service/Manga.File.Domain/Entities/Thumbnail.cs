namespace Manga.File.Domain.Entities;

public sealed class Thumbnail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FileAssetId { get; set; }
    public FileAsset? FileAsset { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
