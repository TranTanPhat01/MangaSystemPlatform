using Grpc.Core;
using Manga.Contracts.Management.V1;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Api.GrpcServices;

public sealed class MangaManagementGrpcServiceImpl : MangaManagementGrpcService.MangaManagementGrpcServiceBase
{
    private readonly IManagementRepository _repository;
    private readonly ILogger<MangaManagementGrpcServiceImpl> _logger;

    public MangaManagementGrpcServiceImpl(
        IManagementRepository repository,
        ILogger<MangaManagementGrpcServiceImpl> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public override async Task<GetSeriesByIdResponse> GetSeriesById(
        GetSeriesByIdRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.SeriesId, out var seriesId))
        {
            _logger.LogWarning("Invalid series id received through Manga gRPC: {SeriesId}", request.SeriesId);
            return new GetSeriesByIdResponse();
        }

        var series = await _repository.GetByIdAsync<Series>(seriesId, context.CancellationToken);
        if (series is null)
        {
            return new GetSeriesByIdResponse();
        }

        _logger.LogInformation("Manga gRPC series lookup succeeded for series {SeriesId}.", seriesId);

        return new GetSeriesByIdResponse
        {
            SeriesId = series.Id.ToString(),
            Title = series.Title,
            Status = series.Status.ToString(),
            AuthorUserId = series.CreatedBy.ToString()
        };
    }

    public override async Task<GetChapterByIdResponse> GetChapterById(
        GetChapterByIdRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.ChapterId, out var chapterId))
        {
            _logger.LogWarning("Invalid chapter id received through Manga gRPC: {ChapterId}", request.ChapterId);
            return new GetChapterByIdResponse();
        }

        var chapter = await _repository.GetByIdAsync<Chapter>(chapterId, context.CancellationToken);
        if (chapter is null)
        {
            return new GetChapterByIdResponse();
        }

        _logger.LogInformation("Manga gRPC chapter lookup succeeded for chapter {ChapterId}.", chapterId);

        return new GetChapterByIdResponse
        {
            ChapterId = chapter.Id.ToString(),
            SeriesId = chapter.SeriesId.ToString(),
            Title = chapter.Title,
            Number = chapter.ChapterNumber,
            Status = chapter.Status.ToString()
        };
    }
}
