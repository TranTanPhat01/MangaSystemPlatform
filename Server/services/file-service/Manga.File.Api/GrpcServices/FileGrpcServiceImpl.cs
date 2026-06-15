using Grpc.Core;
using Manga.Contracts.File.V1;
using Manga.File.Application.Abstractions;
using Manga.File.Domain.Enums;

namespace Manga.File.Api.GrpcServices;

public sealed class FileGrpcServiceImpl : FileGrpcService.FileGrpcServiceBase
{
    private readonly IFileAssetRepository _fileAssetRepository;
    private readonly ILogger<FileGrpcServiceImpl> _logger;

    public FileGrpcServiceImpl(
        IFileAssetRepository fileAssetRepository,
        ILogger<FileGrpcServiceImpl> logger)
    {
        _fileAssetRepository = fileAssetRepository;
        _logger = logger;
    }

    public override async Task<FileExistsResponse> FileExists(
        FileExistsRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.FileId, out var fileId))
        {
            _logger.LogWarning("Invalid file id received through File gRPC: {FileId}", request.FileId);
            return new FileExistsResponse { Exists = false };
        }

        var file = await _fileAssetRepository.GetByIdAsync(fileId, context.CancellationToken);
        if (file is null || file.Status != FileStatus.Active)
        {
            return new FileExistsResponse { Exists = false };
        }

        _logger.LogInformation("File gRPC exists lookup succeeded for file {FileId}.", fileId);

        return new FileExistsResponse
        {
            Exists = true,
            Category = file.FileCategory.ToString(),
            ContentType = file.ContentType
        };
    }

    public override async Task<GetFileMetadataResponse> GetFileMetadata(
        GetFileMetadataRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.FileId, out var fileId))
        {
            _logger.LogWarning("Invalid file id received through File gRPC metadata lookup: {FileId}", request.FileId);
            return new GetFileMetadataResponse();
        }

        var file = await _fileAssetRepository.GetByIdAsync(fileId, context.CancellationToken);
        if (file is null || file.Status != FileStatus.Active)
        {
            return new GetFileMetadataResponse();
        }

        _logger.LogInformation("File gRPC metadata lookup succeeded for file {FileId}.", fileId);

        return new GetFileMetadataResponse
        {
            FileId = file.Id.ToString(),
            FileName = file.OriginalFileName,
            ContentType = file.ContentType,
            Size = file.SizeInBytes,
            Category = file.FileCategory.ToString(),
            Url = file.PublicUrl ?? string.Empty
        };
    }
}
