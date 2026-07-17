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
    public ChapterService(IManagementRepository repository, IManagementUnitOfWork unitOfWork, IEventBus eventBus, IManagementAccessService access) { _repository = repository; _unitOfWork = unitOfWork; _eventBus = eventBus; _access = access; }

    public async Task<Result<ChapterResponse>> CreateAsync(Guid seriesId, CreateChapterRequest request, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Series>(seriesId, cancellationToken) is null) return Result<ChapterResponse>.Failure("Series not found.");
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
        chapter.Status = request.Status;
        if (request.ProgressPercentage.HasValue) chapter.ProgressPercentage = request.ProgressPercentage.Value;
        if (request.Status == ChapterStatus.Approved) chapter.ProgressPercentage = 100;
        chapter.UpdatedAt = DateTime.UtcNow;
        if (request.Status == ChapterStatus.SubmittedForReview) await _eventBus.PublishAsync(new ChapterSubmittedForReviewEvent(Guid.NewGuid(), chapter.Id, chapter.SeriesId, currentUserId, chapter.UpdatedAt.Value), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    public async Task<Result<ChapterResponse>> SubmitChapterForReviewAsync(Guid chapterId, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(chapterId, cancellationToken);
        if (chapter is null) throw new NotFoundException("Chapter not found.", "CHAPTER_NOT_FOUND");
        if (!await _access.CanManageChapterAsync(chapterId, cancellationToken)) return Result<ChapterResponse>.Failure("You do not have permission to manage this chapter.");
        if (chapter.Status is not (ChapterStatus.Draft or ChapterStatus.InProduction or ChapterStatus.RevisionRequired)) return Result<ChapterResponse>.Failure("Chapter cannot be submitted for review in its current status.");
        chapter.Status = ChapterStatus.SubmittedForReview; chapter.ProgressPercentage = Math.Max(chapter.ProgressPercentage, 90); chapter.UpdatedAt = DateTime.UtcNow;
        await _eventBus.PublishAsync(new ChapterSubmittedForReviewEvent(Guid.NewGuid(), chapter.Id, chapter.SeriesId, currentUserId, DateTime.UtcNow), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    private static ChapterResponse ToResponse(Chapter chapter) => new() { Id = chapter.Id, SeriesId = chapter.SeriesId, ChapterNumber = chapter.ChapterNumber, Title = chapter.Title, Status = chapter.Status, ProgressPercentage = chapter.ProgressPercentage, Deadline = chapter.Deadline, CreatedAt = chapter.CreatedAt, UpdatedAt = chapter.UpdatedAt };
}
