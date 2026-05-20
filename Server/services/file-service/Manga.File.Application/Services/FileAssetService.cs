using Manga.File.Application.Abstractions;
using Manga.File.Application.Common;
using Manga.File.Application.DTOs;
using Manga.File.Domain.Entities;
using Manga.File.Domain.Enums;

namespace Manga.File.Application.Services;

public sealed class FileAssetService : IFileAssetService
{
    private readonly IFileAssetRepository _fileAssets;
    private readonly IFileUnitOfWork _unitOfWork;
    private readonly IFileStorageService _storage;
    private readonly ICurrentUserService _currentUser;

    public FileAssetService(
        IFileAssetRepository fileAssets,
        IFileUnitOfWork unitOfWork,
        IFileStorageService storage,
        ICurrentUserService currentUser)
    {
        _fileAssets = fileAssets;
        _unitOfWork = unitOfWork;
        _storage = storage;
        _currentUser = currentUser;
    }

    public async Task<Result<FileUploadResponse>> UploadAsync(
        Stream content,
        string originalFileName,
        string contentType,
        long sizeInBytes,
        FileCategory category,
        CancellationToken cancellationToken = default)
    {
        var storedFileResult = await _storage.SaveAsync(content, originalFileName, contentType, sizeInBytes, cancellationToken);
        if (!storedFileResult.IsSuccess || storedFileResult.Value is null)
        {
            return Result<FileUploadResponse>.Failure(storedFileResult.Error ?? "Unable to store file.");
        }

        var storedFile = storedFileResult.Value;
        var fileAsset = new FileAsset
        {
            OriginalFileName = originalFileName,
            StoredFileName = storedFile.StoredFileName,
            ContentType = contentType,
            Extension = Path.GetExtension(originalFileName).ToLowerInvariant(),
            SizeInBytes = storedFile.SizeInBytes,
            StorageProvider = StorageProvider.Local,
            StoragePath = storedFile.StoragePath,
            PublicUrl = storedFile.PublicUrl,
            UploadedByUserId = _currentUser.UserId,
            FileCategory = category,
            Status = FileStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        await _fileAssets.AddAsync(fileAsset, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<FileUploadResponse>.Success(ToUploadResponse(fileAsset));
    }

    public async Task<Result<FileAssetResponse>> GetByIdAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        var fileAsset = await GetActiveFileAsync(fileId, cancellationToken);
        return fileAsset is null
            ? Result<FileAssetResponse>.Failure("File not found.")
            : Result<FileAssetResponse>.Success(ToResponse(fileAsset));
    }

    public async Task<Result<FileDownloadResponse>> DownloadAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        var fileAsset = await GetActiveFileAsync(fileId, cancellationToken);
        if (fileAsset is null)
        {
            return Result<FileDownloadResponse>.Failure("File not found.");
        }

        var streamResult = await _storage.OpenReadAsync(fileAsset.StoragePath, cancellationToken);
        if (!streamResult.IsSuccess || streamResult.Value is null)
        {
            return Result<FileDownloadResponse>.Failure(streamResult.Error ?? "Unable to open file.");
        }

        return Result<FileDownloadResponse>.Success(new FileDownloadResponse
        {
            Content = streamResult.Value,
            ContentType = fileAsset.ContentType,
            FileName = fileAsset.OriginalFileName
        });
    }

    public async Task<Result<FileUrlResponse>> GetUrlAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        var fileAsset = await GetActiveFileAsync(fileId, cancellationToken);
        return fileAsset is null
            ? Result<FileUrlResponse>.Failure("File not found.")
            : Result<FileUrlResponse>.Success(new FileUrlResponse
            {
                FileId = fileAsset.Id,
                PublicUrl = fileAsset.PublicUrl,
                StoragePath = fileAsset.StoragePath
            });
    }

    public async Task<Result<FileVersionResponse>> CreateVersionAsync(
        Guid fileId,
        Stream content,
        string originalFileName,
        string contentType,
        long sizeInBytes,
        CancellationToken cancellationToken = default)
    {
        var fileAsset = await GetActiveFileAsync(fileId, cancellationToken);
        if (fileAsset is null)
        {
            return Result<FileVersionResponse>.Failure("File not found.");
        }

        var storedFileResult = await _storage.SaveAsync(content, originalFileName, contentType, sizeInBytes, cancellationToken);
        if (!storedFileResult.IsSuccess || storedFileResult.Value is null)
        {
            return Result<FileVersionResponse>.Failure(storedFileResult.Error ?? "Unable to store file version.");
        }

        var storedFile = storedFileResult.Value;
        var version = new FileVersion
        {
            FileAssetId = fileAsset.Id,
            VersionNumber = await _fileAssets.GetNextVersionNumberAsync(fileAsset.Id, cancellationToken),
            StoredFileName = storedFile.StoredFileName,
            StoragePath = storedFile.StoragePath,
            SizeInBytes = storedFile.SizeInBytes,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = _currentUser.UserId
        };

        fileAsset.StoredFileName = storedFile.StoredFileName;
        fileAsset.StoragePath = storedFile.StoragePath;
        fileAsset.PublicUrl = storedFile.PublicUrl;
        fileAsset.ContentType = contentType;
        fileAsset.Extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        fileAsset.SizeInBytes = storedFile.SizeInBytes;
        fileAsset.UpdatedAt = DateTime.UtcNow;

        await _fileAssets.AddVersionAsync(version, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<FileVersionResponse>.Success(ToResponse(version));
    }

    public async Task<Result<IReadOnlyList<FileVersionResponse>>> GetVersionsAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        if (await GetActiveFileAsync(fileId, cancellationToken) is null)
        {
            return Result<IReadOnlyList<FileVersionResponse>>.Failure("File not found.");
        }

        var versions = await _fileAssets.GetVersionsAsync(fileId, cancellationToken);
        return Result<IReadOnlyList<FileVersionResponse>>.Success(versions.Select(ToResponse).ToArray());
    }

    public async Task<Result<bool>> DeleteAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        var fileAsset = await GetActiveFileAsync(fileId, cancellationToken);
        if (fileAsset is null)
        {
            return Result<bool>.Failure("File not found.");
        }

        fileAsset.Status = FileStatus.Deleted;
        fileAsset.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }

    public async Task<Result<IReadOnlyList<FileAssetResponse>>> GetMineAsync(CancellationToken cancellationToken = default)
    {
        var files = await _fileAssets.GetByUploaderAsync(_currentUser.UserId, cancellationToken);
        return Result<IReadOnlyList<FileAssetResponse>>.Success(files.Select(ToResponse).ToArray());
    }

    private async Task<FileAsset?> GetActiveFileAsync(Guid fileId, CancellationToken cancellationToken)
    {
        var fileAsset = await _fileAssets.GetByIdAsync(fileId, cancellationToken);
        return fileAsset?.Status == FileStatus.Active ? fileAsset : null;
    }

    private static FileUploadResponse ToUploadResponse(FileAsset fileAsset) => new()
    {
        FileId = fileAsset.Id,
        OriginalFileName = fileAsset.OriginalFileName,
        StoredFileName = fileAsset.StoredFileName,
        ContentType = fileAsset.ContentType,
        SizeInBytes = fileAsset.SizeInBytes,
        FileCategory = fileAsset.FileCategory,
        PublicUrl = fileAsset.PublicUrl,
        CreatedAt = fileAsset.CreatedAt
    };

    private static FileAssetResponse ToResponse(FileAsset fileAsset) => new()
    {
        Id = fileAsset.Id,
        OriginalFileName = fileAsset.OriginalFileName,
        StoredFileName = fileAsset.StoredFileName,
        ContentType = fileAsset.ContentType,
        Extension = fileAsset.Extension,
        SizeInBytes = fileAsset.SizeInBytes,
        StorageProvider = fileAsset.StorageProvider,
        StoragePath = fileAsset.StoragePath,
        PublicUrl = fileAsset.PublicUrl,
        UploadedByUserId = fileAsset.UploadedByUserId,
        FileCategory = fileAsset.FileCategory,
        Status = fileAsset.Status,
        CreatedAt = fileAsset.CreatedAt,
        UpdatedAt = fileAsset.UpdatedAt
    };

    private static FileVersionResponse ToResponse(FileVersion version) => new()
    {
        Id = version.Id,
        FileAssetId = version.FileAssetId,
        VersionNumber = version.VersionNumber,
        StoredFileName = version.StoredFileName,
        StoragePath = version.StoragePath,
        SizeInBytes = version.SizeInBytes,
        CreatedAt = version.CreatedAt,
        CreatedByUserId = version.CreatedByUserId
    };
}
