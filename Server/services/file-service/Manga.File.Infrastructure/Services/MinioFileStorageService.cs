using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Minio;
using Minio.DataModel.Args;
using Manga.File.Application.Common;
using Manga.File.Application.DTOs;
using Manga.File.Application.Options;
using Manga.File.Application.Services;
using Manga.File.Domain.Enums;

namespace Manga.File.Infrastructure.Services;

internal sealed class MinioFileStorageService : IFileStorageService
{
    public StorageProvider Provider => StorageProvider.MinIO;

    private readonly FileStorageOptions _options;
    private readonly HashSet<string> _allowedExtensions;
    private readonly IMinioClient _minioClient;
    private readonly ILogger<MinioFileStorageService> _logger;
    private bool _bucketInitialized;
    private readonly SemaphoreSlim _bucketLock = new(1, 1);

    public MinioFileStorageService(
        IOptions<FileStorageOptions> options,
        ILogger<MinioFileStorageService> logger)
    {
        _options = options.Value;
        _logger = logger;
        _allowedExtensions = _options.AllowedExtensions
            .Select(extension => extension.ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        _minioClient = new MinioClient()
            .WithEndpoint(_options.Minio.Endpoint)
            .WithCredentials(_options.Minio.AccessKey, _options.Minio.SecretKey)
            .WithSSL(_options.Minio.UseSSL)
            .Build();
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

        try
        {
            await EnsureBucketExistsAsync(cancellationToken);

            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
            var storedFileName = $"{Guid.NewGuid():N}{extension}";

            var putArgs = new PutObjectArgs()
                .WithBucket(_options.Minio.Bucket)
                .WithObject(storedFileName)
                .WithStreamData(fileStream)
                .WithObjectSize(sizeInBytes)
                .WithContentType(contentType);

            await _minioClient.PutObjectAsync(putArgs, cancellationToken);

            var publicUrl = $"{_options.Minio.PublicBaseUrl.TrimEnd('/')}/{_options.Minio.Bucket}/{storedFileName}";

            return Result<StoredFileInfo>.Success(new StoredFileInfo
            {
                StoredFileName = storedFileName,
                StoragePath = storedFileName,
                PublicUrl = publicUrl,
                SizeInBytes = sizeInBytes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file {FileName} to MinIO", originalFileName);
            return Result<StoredFileInfo>.Failure($"MinIO upload failed: {ex.Message}");
        }
    }

    public async Task<Result<Stream>> OpenReadAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var memoryStream = new MemoryStream();
            var getArgs = new GetObjectArgs()
                .WithBucket(_options.Minio.Bucket)
                .WithObject(storagePath)
                .WithCallbackStream(stream =>
                {
                    stream.CopyTo(memoryStream);
                });

            await _minioClient.GetObjectAsync(getArgs, cancellationToken);
            memoryStream.Position = 0;

            return Result<Stream>.Success(memoryStream);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file {StoragePath} from MinIO", storagePath);
            return Result<Stream>.Failure($"MinIO download failed: {ex.Message}");
        }
    }

    private async Task EnsureBucketExistsAsync(CancellationToken cancellationToken)
    {
        if (_bucketInitialized) return;

        await _bucketLock.WaitAsync(cancellationToken);
        try
        {
            if (_bucketInitialized) return;

            var bucketExistsArgs = new BucketExistsArgs().WithBucket(_options.Minio.Bucket);
            var exists = await _minioClient.BucketExistsAsync(bucketExistsArgs, cancellationToken);
            if (!exists)
            {
                _logger.LogInformation("MinIO bucket {Bucket} does not exist. Creating it...", _options.Minio.Bucket);
                var makeBucketArgs = new MakeBucketArgs().WithBucket(_options.Minio.Bucket);
                await _minioClient.MakeBucketAsync(makeBucketArgs, cancellationToken);

                try
                {
                    var policyJson = $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [
                            {{
                                ""Effect"": ""Allow"",
                                ""Principal"": ""*"",
                                ""Action"": [""s3:GetObject""],
                                ""Resource"": [""arn:aws:s3:::{_options.Minio.Bucket}/*""]
                            }}
                        ]
                    }}";
                    var setPolicyArgs = new SetPolicyArgs()
                        .WithBucket(_options.Minio.Bucket)
                        .WithPolicy(policyJson);
                    await _minioClient.SetPolicyAsync(setPolicyArgs, cancellationToken);
                }
                catch (Exception policyEx)
                {
                    _logger.LogWarning(policyEx, "Failed to set public policy on bucket {Bucket}. Public URLs might require authentication.", _options.Minio.Bucket);
                }
            }

            _bucketInitialized = true;
        }
        finally
        {
            _bucketLock.Release();
        }
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
}
