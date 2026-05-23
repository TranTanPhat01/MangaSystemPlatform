namespace Manga.File.Application.Options;

public sealed class FileStorageOptions
{
    public string Provider { get; set; } = "Local";
    public string RootPath { get; set; } = "storage/files";
    public int MaxFileSizeInMb { get; set; } = 20;
    public string[] AllowedExtensions { get; set; } = Array.Empty<string>();
}
