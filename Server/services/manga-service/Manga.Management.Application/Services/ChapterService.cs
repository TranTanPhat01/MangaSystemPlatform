using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Application.Services;

public sealed class ChapterService : IChapterService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly IEventBus _eventBus;
    private readonly IManagementAccessService _access;
    private readonly IReaderRepository? _readerRepository;
    public ChapterService(IManagementRepository repository, IManagementUnitOfWork unitOfWork, IEventBus eventBus, IManagementAccessService access) : this(repository, unitOfWork, eventBus, access, null) { }
    public ChapterService(IManagementRepository repository, IManagementUnitOfWork unitOfWork, IEventBus eventBus, IManagementAccessService access, IReaderRepository? readerRepository) { _repository = repository; _unitOfWork = unitOfWork; _eventBus = eventBus; _access = access; _readerRepository = readerRepository; }

    public async Task<Result<ChapterResponse>> CreateAsync(Guid seriesId, CreateChapterRequest request, CancellationToken cancellationToken = default)
    {
        var series = await _repository.GetByIdAsync<Series>(seriesId, cancellationToken);
        if (series is null) return Result<ChapterResponse>.Failure("Series not found.");
        if (series.Status == SeriesStatus.Cancelled) return Result<ChapterResponse>.Failure("Cannot create chapters for a cancelled series.");
        if (!await _access.CanManageSeriesAsync(seriesId, cancellationToken)) return Result<ChapterResponse>.Failure("You do not have permission to manage this series.");
        var chapter = new Chapter { SeriesId = seriesId, ChapterNumber = request.ChapterNumber, Title = request.Title.Trim(), Deadline = request.Deadline, ProgressPercentage = request.ProgressPercentage, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(chapter, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    public async Task<Result<IReadOnlyList<ChapterResponse>>> GetBySeriesAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        if (!await _access.CanAccessSeriesAsync(seriesId, cancellationToken)) return Result<IReadOnlyList<ChapterResponse>>.Failure("Series not found.");
        var chapters = await _repository.ListAsync<Chapter>(chapter => chapter.SeriesId == seriesId, cancellationToken);
        return Result<IReadOnlyList<ChapterResponse>>.Success(chapters.Select(ToResponse).OrderBy(chapter => chapter.ChapterNumber).ToArray());
    }

    public async Task<Result<ChapterResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(id, cancellationToken);
        return chapter is null || !await _access.CanAccessChapterAsync(id, cancellationToken) ? Result<ChapterResponse>.Failure("Chapter not found.") : Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    public async Task<Result<ChapterResponse>> UpdateStatusAsync(Guid id, UpdateChapterStatusRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(id, cancellationToken);
        if (chapter is null) return Result<ChapterResponse>.Failure("Chapter not found.");
        if (!await _access.CanManageChapterAsync(id, cancellationToken)) return Result<ChapterResponse>.Failure("You do not have permission to manage this chapter.");

        if (request.Status == ChapterStatus.SubmittedForReview)
        {
            return Result<ChapterResponse>.Failure("To submit a chapter for review, please use the dedicated submit-review endpoint.");
        }

        if (request.Status is ChapterStatus.Approved or ChapterStatus.RevisionRequired or ChapterStatus.Rejected)
        {
            return Result<ChapterResponse>.Failure("Chapter review status can only be modified through the editorial review workflow.");
        }

        var isAdmin = _access.IsAdministrator;
        if (request.Status is ChapterStatus.Scheduled or ChapterStatus.Published)
        {
            if (!isAdmin)
            {
                return Result<ChapterResponse>.Failure("Only administrators or the publication workflow can publish chapters.");
            }
        }

        if (!IsValidUserStatusTransition(chapter.Status, request.Status, isAdmin))
        {
            return Result<ChapterResponse>.Failure($"Invalid chapter status transition from {chapter.Status} to {request.Status}.");
        }

        var wasPublished = chapter.Status == ChapterStatus.Published;
        chapter.Status = request.Status;
        if (request.ProgressPercentage.HasValue) chapter.ProgressPercentage = request.ProgressPercentage.Value;
        if (request.Status == ChapterStatus.Approved) chapter.ProgressPercentage = 100;
        chapter.UpdatedAt = DateTime.UtcNow;

        if (request.Status == ChapterStatus.Published && !wasPublished)
        {
            var publishedAt = DateTime.UtcNow;
            var publicationEvent = new ChapterPublishedEvent(Guid.NewGuid(), chapter.Id, chapter.SeriesId, chapter.Title, publishedAt);
            await _eventBus.PublishAsync(publicationEvent, cancellationToken);
            var readerIds = _readerRepository is null
                ? (await _repository.ListAsync<ReaderFavorite>(x => x.SeriesId == chapter.SeriesId, cancellationToken)).Select(x => x.UserId)
                : await _readerRepository.GetFavoriteUserIdsAsync(chapter.SeriesId, cancellationToken);
            foreach (var readerId in readerIds)
            {
                await _eventBus.PublishAsync(new ReaderChapterNotificationRequestedEvent(Guid.NewGuid(), publicationEvent.EventId, readerId, chapter.Id, chapter.SeriesId, chapter.Title, publishedAt), cancellationToken);
            }
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    public async Task<Result<ChapterResponse>> SubmitChapterForReviewAsync(Guid chapterId, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(chapterId, cancellationToken);
        if (chapter is null) throw new NotFoundException("Chapter not found.", "CHAPTER_NOT_FOUND");
        if (!await _access.CanManageChapterAsync(chapterId, cancellationToken)) return Result<ChapterResponse>.Failure("You do not have permission to manage this chapter.");

        if (chapter.Status == ChapterStatus.SubmittedForReview)
        {
            return Result<ChapterResponse>.Failure("Chapter is already submitted for review.");
        }

        if (chapter.Status == ChapterStatus.Draft)
        {
            return Result<ChapterResponse>.Failure("Chapter must be transitioned from Draft to InProduction before submitting for review.");
        }

        if (chapter.Status is not (ChapterStatus.InProduction or ChapterStatus.RevisionRequired))
        {
            return Result<ChapterResponse>.Failure($"Chapter cannot be submitted for review in its current status: {chapter.Status}.");
        }

        var pages = await _repository.ListAsync<Page>(p => p.ChapterId == chapterId, cancellationToken);
        if (pages.Count == 0) return Result<ChapterResponse>.Failure("Chapter must contain at least one page scan to submit for review.");

        if (pages.Any(p => !p.FileId.HasValue || p.FileId == Guid.Empty))
        {
            return Result<ChapterResponse>.Failure("Every page in the chapter must have a valid file reference.");
        }

        var pageIds = pages.Select(p => p.Id).ToList();
        var tasks = await _repository.ListAsync<MangaTask>(t => pageIds.Contains(t.PageId), cancellationToken);
        if (tasks.Any(t => t.Status != Manga.Management.Domain.Enums.TaskStatus.Approved))
        {
            return Result<ChapterResponse>.Failure("All tasks in the chapter must be approved before submission.");
        }

        chapter.Status = ChapterStatus.SubmittedForReview;
        chapter.ProgressPercentage = Math.Max(chapter.ProgressPercentage, 90);
        chapter.UpdatedAt = DateTime.UtcNow;

        await _eventBus.PublishAsync(new ChapterSubmittedForReviewEvent(Guid.NewGuid(), chapter.Id, chapter.SeriesId, currentUserId, DateTime.UtcNow), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    private static bool IsValidUserStatusTransition(ChapterStatus current, ChapterStatus target, bool isAdmin)
    {
        if (current == target) return true;

        if (isAdmin)
        {
            if (current == ChapterStatus.Approved && target is ChapterStatus.Scheduled or ChapterStatus.Published)
                return true;
            if (current == ChapterStatus.Scheduled && target == ChapterStatus.Published)
                return true;
        }

        return current switch
        {
            ChapterStatus.Draft => target == ChapterStatus.InProduction,
            ChapterStatus.RevisionRequired => target == ChapterStatus.InProduction,
            _ => false
        };
    }

    private static ChapterResponse ToResponse(Chapter chapter) => new() { Id = chapter.Id, SeriesId = chapter.SeriesId, ChapterNumber = chapter.ChapterNumber, Title = chapter.Title, Status = chapter.Status, ProgressPercentage = chapter.ProgressPercentage, Deadline = chapter.Deadline, CreatedAt = chapter.CreatedAt, UpdatedAt = chapter.UpdatedAt };
}
