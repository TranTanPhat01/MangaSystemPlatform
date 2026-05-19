using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class ChapterService : IChapterService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;

    public ChapterService(IManagementRepository repository, IManagementUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ChapterResponse>> CreateAsync(Guid seriesId, CreateChapterRequest request, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Series>(seriesId, cancellationToken) is null)
        {
            return Result<ChapterResponse>.Failure("Series not found.");
        }

        var chapter = new Chapter
        {
            SeriesId = seriesId,
            ChapterNumber = request.ChapterNumber,
            Title = request.Title.Trim(),
            Deadline = request.Deadline,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(chapter, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    public async Task<Result<IReadOnlyList<ChapterResponse>>> GetBySeriesAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        var chapters = await _repository.ListAsync<Chapter>(chapter => chapter.SeriesId == seriesId, cancellationToken);
        return Result<IReadOnlyList<ChapterResponse>>.Success(chapters.Select(ToResponse).OrderBy(chapter => chapter.ChapterNumber).ToArray());
    }

    public async Task<Result<ChapterResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(id, cancellationToken);
        return chapter is null
            ? Result<ChapterResponse>.Failure("Chapter not found.")
            : Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    public async Task<Result<ChapterResponse>> UpdateStatusAsync(Guid id, UpdateChapterStatusRequest request, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(id, cancellationToken);
        if (chapter is null)
        {
            return Result<ChapterResponse>.Failure("Chapter not found.");
        }

        chapter.Status = request.Status;
        chapter.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<ChapterResponse>.Success(ToResponse(chapter));
    }

    private static ChapterResponse ToResponse(Chapter chapter) => new()
    {
        Id = chapter.Id,
        SeriesId = chapter.SeriesId,
        ChapterNumber = chapter.ChapterNumber,
        Title = chapter.Title,
        Status = chapter.Status,
        Deadline = chapter.Deadline,
        CreatedAt = chapter.CreatedAt,
        UpdatedAt = chapter.UpdatedAt
    };
}
