using Grpc.Core;
using Manga.Contracts.Management.V1;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Api.GrpcServices;

public sealed class MangaManagementGrpcServiceImpl : MangaManagementGrpcService.MangaManagementGrpcServiceBase
{
    private readonly IManagementRepository _repository;
    private readonly ILogger<MangaManagementGrpcServiceImpl> _logger;
    private readonly IManagementUnitOfWork _unitOfWork;

    public MangaManagementGrpcServiceImpl(
        IManagementRepository repository,
        ILogger<MangaManagementGrpcServiceImpl> logger,
        IManagementUnitOfWork unitOfWork)
    {
        _repository = repository;
        _logger = logger;
        _unitOfWork = unitOfWork;
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

    public override async Task<CanAccessFileResponse> CanAccessFile(
        CanAccessFileRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId) ||
            !Guid.TryParse(request.FileId, out var fileId) ||
            !string.Equals(request.AccessType, "Read", StringComparison.OrdinalIgnoreCase))
        {
            return new CanAccessFileResponse { Allowed = false };
        }

        if (await CanReadPageFileAsync(userId, fileId, context.CancellationToken) ||
            await CanReadSubmissionFileAsync(userId, fileId, context.CancellationToken))
        {
            _logger.LogInformation("Manga gRPC file access granted for user {UserId} and file {FileId}.", userId, fileId);
            return new CanAccessFileResponse { Allowed = true };
        }

        return new CanAccessFileResponse { Allowed = false };
    }

    public override async Task<ApplyProposalDecisionResponse> ApplyProposalDecision(ApplyProposalDecisionRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.SeriesId, out var seriesId)) return new ApplyProposalDecisionResponse { Applied = false };
        var series = await _repository.GetByIdAsync<Series>(seriesId, context.CancellationToken);
        if (series is null || series.Status != SeriesStatus.Submitted) return new ApplyProposalDecisionResponse { Applied = false };
        series.Status = request.Decision switch
        {
            "Approve" => SeriesStatus.Approved,
            "Reject" => SeriesStatus.Rejected,
            "RequestRevision" => SeriesStatus.RevisionRequested,
            _ => series.Status
        };
        if (series.Status == SeriesStatus.Submitted) return new ApplyProposalDecisionResponse { Applied = false };
        series.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(context.CancellationToken);
        _logger.LogInformation("Series proposal {SeriesId} updated to {Status} by Editorial decision.", series.Id, series.Status);
        return new ApplyProposalDecisionResponse { Applied = true };
    }

    private async Task<bool> CanReadPageFileAsync(Guid userId, Guid fileId, CancellationToken cancellationToken)
    {
        var pages = await _repository.ListAsync<Page>(page => page.FileId == fileId, cancellationToken);
        foreach (var page in pages)
        {
            if (await IsSeriesOwnerAsync(userId, page.ChapterId, cancellationToken)) return true;
            var assignedTasks = await _repository.ListAsync<MangaTask>(task => task.PageId == page.Id && task.AssignedToUserId == userId, cancellationToken);
            if (assignedTasks.Count > 0) return true;
        }

        return false;
    }

    private async Task<bool> CanReadSubmissionFileAsync(Guid userId, Guid fileId, CancellationToken cancellationToken)
    {
        var submissions = await _repository.ListAsync<Submission>(submission => submission.FileId == fileId, cancellationToken);
        foreach (var submission in submissions)
        {
            var task = await _repository.GetByIdAsync<MangaTask>(submission.TaskId, cancellationToken);
            if (task is null) continue;
            if (task.AssignedToUserId == userId && submission.SubmittedByUserId == userId) return true;
            if (await IsSeriesOwnerAsync(userId, task.PageId, cancellationToken)) return true;
        }

        return false;
    }

    private async Task<bool> IsSeriesOwnerAsync(Guid userId, Guid pageOrChapterId, CancellationToken cancellationToken)
    {
        var page = await _repository.GetByIdAsync<Page>(pageOrChapterId, cancellationToken);
        var chapterId = page?.ChapterId ?? pageOrChapterId;
        var chapter = await _repository.GetByIdAsync<Chapter>(chapterId, cancellationToken);
        if (chapter is null) return false;
        var series = await _repository.GetByIdAsync<Series>(chapter.SeriesId, cancellationToken);
        if (series is null) return false;
        if (series.CreatedBy == userId) return true;
        var studio = await _repository.GetByIdAsync<Studio>(series.StudioId, cancellationToken);
        return studio?.OwnerId == userId;
    }

    public override async Task<ValidatePageAndAnnotationResponse> ValidatePageAndAnnotation(
        ValidatePageAndAnnotationRequest request,
        ServerCallContext context)
    {
        var response = new ValidatePageAndAnnotationResponse
        {
            PageValid = true,
            AnnotationValid = true
        };

        if (!Guid.TryParse(request.ChapterId, out var chapterId))
        {
            response.PageValid = false;
            response.AnnotationValid = false;
            return response;
        }

        Guid? parsedPageId = null;
        if (!string.IsNullOrWhiteSpace(request.PageId) && Guid.TryParse(request.PageId, out var pageId))
        {
            parsedPageId = pageId;
            var page = await _repository.GetByIdAsync<Page>(pageId, context.CancellationToken);
            if (page is null || page.ChapterId != chapterId)
            {
                response.PageValid = false;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.AnnotationId) && Guid.TryParse(request.AnnotationId, out var annotationId))
        {
            var annotation = await _repository.GetByIdAsync<Annotation>(annotationId, context.CancellationToken);
            if (annotation is null || !parsedPageId.HasValue || annotation.PageId != parsedPageId.Value)
            {
                response.AnnotationValid = false;
            }
        }

        return response;
    }

    public override async Task<UpdateSeriesStatusResponse> UpdateSeriesStatus(UpdateSeriesStatusRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.SeriesId, out var seriesId)) return new UpdateSeriesStatusResponse { Success = false };
        var series = await _repository.GetByIdAsync<Series>(seriesId, context.CancellationToken);
        if (series is null) return new UpdateSeriesStatusResponse { Success = false };

        if (!Enum.TryParse<SeriesStatus>(request.Status, true, out var newStatus))
        {
            return new UpdateSeriesStatusResponse { Success = false };
        }

        if (series.Status == SeriesStatus.Cancelled)
        {
            return new UpdateSeriesStatusResponse { Success = false };
        }

        series.Status = newStatus;
        series.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(context.CancellationToken);
        
        _logger.LogInformation("Series {SeriesId} status updated to {Status} via gRPC.", series.Id, series.Status);
        return new UpdateSeriesStatusResponse { Success = true };
    }
}
