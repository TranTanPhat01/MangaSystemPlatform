using Grpc.Core;
using Manga.Contracts.Management.V1;
using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Manga.Editorial.Infrastructure.GrpcClients;

internal sealed class MangaGrpcClient : IMangaLookupClient
{
    private readonly MangaManagementGrpcService.MangaManagementGrpcServiceClient _client;
    private readonly ILogger<MangaGrpcClient> _logger;
    private readonly int _timeoutSeconds;

    public MangaGrpcClient(
        MangaManagementGrpcService.MangaManagementGrpcServiceClient client,
        IConfiguration configuration,
        ILogger<MangaGrpcClient> logger)
    {
        _client = client;
        _logger = logger;
        _timeoutSeconds = configuration.GetValue("Grpc:Manga:TimeoutSeconds", 2);
    }

    public async Task<SeriesSummaryDto?> GetSeriesByIdAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting series {SeriesId} through Manga gRPC.", seriesId);

            var response = await _client.GetSeriesByIdAsync(
                new GetSeriesByIdRequest { SeriesId = seriesId.ToString() },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);

            if (!Guid.TryParse(response.SeriesId, out var parsedSeriesId) ||
                !Guid.TryParse(response.AuthorUserId, out var authorUserId))
            {
                return null;
            }

            return new SeriesSummaryDto
            {
                SeriesId = parsedSeriesId,
                Title = response.Title,
                Status = response.Status,
                AuthorUserId = authorUserId
            };
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Manga gRPC series lookup failed for series {SeriesId}.", seriesId);
            return null;
        }
    }

    public async Task<ChapterSummaryDto?> GetChapterByIdAsync(Guid chapterId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting chapter {ChapterId} through Manga gRPC.", chapterId);

            var response = await _client.GetChapterByIdAsync(
                new GetChapterByIdRequest { ChapterId = chapterId.ToString() },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);

            if (!Guid.TryParse(response.ChapterId, out var parsedChapterId) ||
                !Guid.TryParse(response.SeriesId, out var parsedSeriesId))
            {
                return null;
            }

            return new ChapterSummaryDto
            {
                ChapterId = parsedChapterId,
                SeriesId = parsedSeriesId,
                Title = response.Title,
                Number = response.Number,
                Status = response.Status
            };
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Manga gRPC chapter lookup failed for chapter {ChapterId}.", chapterId);
            return null;
        }
    }
}
