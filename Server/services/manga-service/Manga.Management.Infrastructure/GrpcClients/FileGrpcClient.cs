using Grpc.Core;
using Manga.Contracts.File.V1;
using Manga.Management.Application.Abstractions;
using Manga.Management.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Manga.Management.Infrastructure.GrpcClients;

internal sealed class FileGrpcClient : IFileLookupClient
{
    private readonly FileGrpcService.FileGrpcServiceClient _client;
    private readonly ILogger<FileGrpcClient> _logger;
    private readonly int _timeoutSeconds;

    public FileGrpcClient(
        FileGrpcService.FileGrpcServiceClient client,
        IConfiguration configuration,
        ILogger<FileGrpcClient> logger)
    {
        _client = client;
        _logger = logger;
        _timeoutSeconds = configuration.GetValue("Grpc:File:TimeoutSeconds", 2);
    }

    public async Task<bool> FileExistsAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Checking file {FileId} through File gRPC.", fileId);

            var response = await _client.FileExistsAsync(
                new FileExistsRequest { FileId = fileId.ToString() },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);

            return response.Exists;
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "File gRPC exists lookup failed for file {FileId}.", fileId);
            return false;
        }
    }

    public async Task<FileMetadataDto?> GetFileMetadataAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting file metadata {FileId} through File gRPC.", fileId);

            var response = await _client.GetFileMetadataAsync(
                new GetFileMetadataRequest { FileId = fileId.ToString() },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);

            if (!Guid.TryParse(response.FileId, out var parsedFileId))
            {
                return null;
            }

            return new FileMetadataDto
            {
                FileId = parsedFileId,
                FileName = response.FileName,
                ContentType = response.ContentType,
                Size = response.Size,
                Category = response.Category,
                Url = response.Url
            };
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "File gRPC metadata lookup failed for file {FileId}.", fileId);
            return null;
        }
    }
}
