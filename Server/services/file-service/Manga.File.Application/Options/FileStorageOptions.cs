namespace Manga.File.Application.Options;

public sealed class FileStorageOptions
{
    public string Provider { get; set; } = "Local";
    public string RootPath { get; set; } = "storage/files";
    public int MaxFileSizeInMb { get; set; } = 20;
    public string[] AllowedExtensions { get; set; } = Array.Empty<string>();

    public LocalStorageOptions Local { get; set; } = new();
    public MinioStorageOptions Minio { get; set; } = new();
}

public sealed class LocalStorageOptions
{
    public string RootPath { get; set; } = "storage/files";
}

public sealed class MinioStorageOptions
{
    public string Endpoint { get; set; } = "localhost:9000";
    public string AccessKey { get; set; } = "minioadmin";
    public string SecretKey { get; set; } = "minioadmin";
    public string Bucket { get; set; } = "manga-files";
    public bool UseSSL { get; set; } = false;
    public string PublicBaseUrl { get; set; } = "http://localhost:9000";
}
