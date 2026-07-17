using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class PageService : IPageService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly IFileLookupClient _fileLookupClient;
    private readonly IManagementAccessService _access;
    public PageService(IManagementRepository repository, IManagementUnitOfWork unitOfWork, IFileLookupClient fileLookupClient, IManagementAccessService access) { _repository = repository; _unitOfWork = unitOfWork; _fileLookupClient = fileLookupClient; _access = access; }

    public async Task<Result<PageResponse>> CreateAsync(Guid chapterId, CreatePageRequest request, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Chapter>(chapterId, cancellationToken) is null) return Result<PageResponse>.Failure("Chapter not found.");
        if (!await _access.CanManageChapterAsync(chapterId, cancellationToken)) return Result<PageResponse>.Failure("You do not have permission to manage this chapter.");
        if (request.FileId.HasValue && !await _fileLookupClient.FileExistsAsync(request.FileId.Value, cancellationToken)) return Result<PageResponse>.Failure("File does not exist or is not accessible.");
        var page = new Page { ChapterId = chapterId, PageNumber = request.PageNumber, FileId = request.FileId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(page, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<PageResponse>.Success(ToResponse(page));
    }

    public async Task<Result<IReadOnlyList<PageResponse>>> GetByChapterAsync(Guid chapterId, CancellationToken cancellationToken = default)
    {
        if (!await _access.CanAccessChapterAsync(chapterId, cancellationToken)) return Result<IReadOnlyList<PageResponse>>.Failure("Chapter not found.");
        var pages = await _repository.ListAsync<Page>(page => page.ChapterId == chapterId, cancellationToken);
        return Result<IReadOnlyList<PageResponse>>.Success(pages.Select(ToResponse).OrderBy(page => page.PageNumber).ToArray());
    }

    public async Task<Result<PageResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var page = await _repository.GetByIdAsync<Page>(id, cancellationToken);
        return page is null || !await _access.CanAccessPageAsync(id, cancellationToken) ? Result<PageResponse>.Failure("Page not found.") : Result<PageResponse>.Success(ToResponse(page));
    }

    public async Task<Result<PageResponse>> UpdateStatusAsync(Guid id, UpdatePageStatusRequest request, CancellationToken cancellationToken = default)
    {
        var page = await _repository.GetByIdAsync<Page>(id, cancellationToken);
        if (page is null) return Result<PageResponse>.Failure("Page not found.");
        if (!await _access.CanManagePageAsync(id, cancellationToken)) return Result<PageResponse>.Failure("You do not have permission to manage this page.");
        page.Status = request.Status; page.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<PageResponse>.Success(ToResponse(page));
    }

    private static PageResponse ToResponse(Page page) => new() { Id = page.Id, ChapterId = page.ChapterId, PageNumber = page.PageNumber, FileId = page.FileId, Status = page.Status, CreatedAt = page.CreatedAt, UpdatedAt = page.UpdatedAt };
}
