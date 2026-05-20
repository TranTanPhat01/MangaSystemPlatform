using Microsoft.Extensions.Options;
using Manga.File.Application.Common;
using Manga.File.Application.DTOs;
using Manga.File.Application.Options;
using Manga.File.Application.Services;

namespace Manga.File.Infrastructure.Services;

internal sealed class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageOptions _options;
    private readonly HashSet<string> _allowedExtensions;

    public LocalFileStorageService(IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
        _allowedExtensions = _options.AllowedExtensions
            .Select(extension => extension.ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    public async Task<Result<StoredFileInfo>> SaveAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        long sizeInBytes,
        CancellationToken cancellationToken = default)
    {
        var validationError = Validate(originalFileName, sizeInBytes);
        if (validationError is not null)
        {
            return Result<StoredFileInfo>.Failure(validationError);
        }

        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var rootPath = GetRootPath();
        Directory.CreateDirectory(rootPath);

        var absolutePath = Path.Combine(rootPath, storedFileName);
        await using var output = System.IO.File.Create(absolutePath);
        await fileStream.CopyToAsync(output, cancellationToken);

        return Result<StoredFileInfo>.Success(new StoredFileInfo
        {
            StoredFileName = storedFileName,
            StoragePath = absolutePath,
            PublicUrl = $"/files/static/{storedFileName}",
            SizeInBytes = sizeInBytes
        });
    }

    public Task<Result<Stream>> OpenReadAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        if (!System.IO.File.Exists(storagePath))
        {
            return Task.FromResult(Result<Stream>.Failure("Stored file not found."));
        }

        Stream stream = System.IO.File.OpenRead(storagePath);
        return Task.FromResult(Result<Stream>.Success(stream));
    }

    private string? Validate(string originalFileName, long sizeInBytes)
    {
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension) || !_allowedExtensions.Contains(extension))
        {
            return $"File extension '{extension}' is not allowed.";
        }

        var maxBytes = _options.MaxFileSizeInMb * 1024L * 1024L;
        if (sizeInBytes > maxBytes)
        {
            return $"File size exceeds {_options.MaxFileSizeInMb}MB.";
        }

        return null;
    }

    private string GetRootPath()
    {
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), _options.RootPath));
    }
}
