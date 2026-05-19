namespace Manga.File.Application.DTOs;

public sealed class StoredFileInfo
{
    public string StoredFileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
}
