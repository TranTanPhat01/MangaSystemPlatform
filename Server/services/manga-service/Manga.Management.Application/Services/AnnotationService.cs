using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class AnnotationService : IAnnotationService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly IManagementAccessService _access;
    public AnnotationService(IManagementRepository repository, IManagementUnitOfWork unitOfWork, IManagementAccessService access) { _repository = repository; _unitOfWork = unitOfWork; _access = access; }

    public async Task<Result<AnnotationResponse>> CreateAsync(Guid pageId, CreateAnnotationRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Page>(pageId, cancellationToken) is null) return Result<AnnotationResponse>.Failure("Page not found.");
        if (!await _access.CanManagePageAsync(pageId, cancellationToken)) return Result<AnnotationResponse>.Failure("You do not have permission to manage this page.");
        var annotation = new Annotation { PageId = pageId, Type = request.Type, CoordinatesJson = request.CoordinatesJson, Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(), CreatedBy = currentUserId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(annotation, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AnnotationResponse>.Success(ToResponse(annotation));
    }

    public async Task<Result<IReadOnlyList<AnnotationResponse>>> GetByPageAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        if (!await _access.CanAccessPageAsync(pageId, cancellationToken)) return Result<IReadOnlyList<AnnotationResponse>>.Failure("Page not found.");
        var annotations = await _repository.ListAsync<Annotation>(annotation => annotation.PageId == pageId, cancellationToken);
        return Result<IReadOnlyList<AnnotationResponse>>.Success(annotations.Select(ToResponse).ToArray());
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var annotation = await _repository.GetByIdAsync<Annotation>(id, cancellationToken);
        if (annotation is null || !await _access.CanManageAnnotationAsync(id, cancellationToken)) return Result<bool>.Failure("Annotation not found.");
        _repository.Remove(annotation); await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    private static AnnotationResponse ToResponse(Annotation annotation) => new() { Id = annotation.Id, PageId = annotation.PageId, Type = annotation.Type, CoordinatesJson = annotation.CoordinatesJson, Description = annotation.Description, CreatedBy = annotation.CreatedBy, CreatedAt = annotation.CreatedAt };
}
