using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class PageService : IPageService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;

    public PageService(IManagementRepository repository, IManagementUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PageResponse>> CreateAsync(Guid chapterId, CreatePageRequest request, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Chapter>(chapterId, cancellationToken) is null)
        {
            return Result<PageResponse>.Failure("Chapter not found.");
        }

        var page = new Page
        {
            ChapterId = chapterId,
            PageNumber = request.PageNumber,
            FileId = request.FileId,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(page, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<PageResponse>.Success(ToResponse(page));
    }

    public async Task<Result<IReadOnlyList<PageResponse>>> GetByChapterAsync(Guid chapterId, CancellationToken cancellationToken = default)
    {
        var pages = await _repository.ListAsync<Page>(page => page.ChapterId == chapterId, cancellationToken);
        return Result<IReadOnlyList<PageResponse>>.Success(pages.Select(ToResponse).OrderBy(page => page.PageNumber).ToArray());
    }

    public async Task<Result<PageResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var page = await _repository.GetByIdAsync<Page>(id, cancellationToken);
        return page is null
            ? Result<PageResponse>.Failure("Page not found.")
            : Result<PageResponse>.Success(ToResponse(page));
    }

    public async Task<Result<PageResponse>> UpdateStatusAsync(Guid id, UpdatePageStatusRequest request, CancellationToken cancellationToken = default)
    {
        var page = await _repository.GetByIdAsync<Page>(id, cancellationToken);
        if (page is null)
        {
            return Result<PageResponse>.Failure("Page not found.");
        }

        page.Status = request.Status;
        page.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<PageResponse>.Success(ToResponse(page));
    }

    private static PageResponse ToResponse(Page page) => new()
    {
        Id = page.Id,
        ChapterId = page.ChapterId,
        PageNumber = page.PageNumber,
        FileId = page.FileId,
        Status = page.Status,
        CreatedAt = page.CreatedAt,
        UpdatedAt = page.UpdatedAt
    };
}
