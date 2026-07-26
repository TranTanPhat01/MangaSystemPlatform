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

    public async Task<bool> ApplyProposalDecisionAsync(Guid seriesId, string decision, string reason, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.ApplyProposalDecisionAsync(
                new ApplyProposalDecisionRequest { SeriesId = seriesId.ToString(), Decision = decision, Reason = reason },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds), cancellationToken: cancellationToken);
            return response.Applied;
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Manga gRPC proposal decision failed for series {SeriesId}.", seriesId);
            return false;
        }
    }

    public async Task<(bool PageValid, bool AnnotationValid)> ValidatePageAndAnnotationAsync(Guid chapterId, Guid? pageId, Guid? annotationId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.ValidatePageAndAnnotationAsync(
                new ValidatePageAndAnnotationRequest
                {
                    ChapterId = chapterId.ToString(),
                    PageId = pageId?.ToString() ?? string.Empty,
                    AnnotationId = annotationId?.ToString() ?? string.Empty
                },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);
            return (response.PageValid, response.AnnotationValid);
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Manga gRPC page/annotation validation failed for chapter {ChapterId}.", chapterId);
            return (false, false);
        }
    }

    public async Task<bool> UpdateSeriesStatusAsync(Guid seriesId, string status, string reason, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.UpdateSeriesStatusAsync(
                new UpdateSeriesStatusRequest { SeriesId = seriesId.ToString(), Status = status, Reason = reason },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);
            return response.Success;
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Manga gRPC update status failed for series {SeriesId}.", seriesId);
            return false;
        }
    }
}
