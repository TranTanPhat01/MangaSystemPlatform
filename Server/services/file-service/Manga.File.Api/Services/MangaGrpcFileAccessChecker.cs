using Grpc.Core;
using Manga.Contracts.Management.V1;
using Manga.File.Application.Services;

namespace Manga.File.Api.Services;

public sealed class MangaGrpcFileAccessChecker : IMangaFileAccessChecker
{
    private readonly MangaManagementGrpcService.MangaManagementGrpcServiceClient _client;
    private readonly ILogger<MangaGrpcFileAccessChecker> _logger;
    private readonly int _timeoutSeconds;

    public MangaGrpcFileAccessChecker(MangaManagementGrpcService.MangaManagementGrpcServiceClient client, IConfiguration configuration, ILogger<MangaGrpcFileAccessChecker> logger)
    { _client = client; _logger = logger; _timeoutSeconds = configuration.GetValue("Grpc:Manga:TimeoutSeconds", 2); }

    public async Task<bool> CanReadAsync(Guid userId, Guid fileId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.CanAccessFileAsync(new CanAccessFileRequest { UserId = userId.ToString(), FileId = fileId.ToString(), AccessType = "Read" }, deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds), cancellationToken: cancellationToken);
            return response.Allowed;
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Manga file access check failed for user {UserId} and file {FileId}.", userId, fileId);
            return false;
        }
    }
}
