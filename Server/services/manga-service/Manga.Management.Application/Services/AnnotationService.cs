using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class AnnotationService : IAnnotationService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;

    public AnnotationService(IManagementRepository repository, IManagementUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<AnnotationResponse>> CreateAsync(Guid pageId, CreateAnnotationRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Page>(pageId, cancellationToken) is null)
        {
            return Result<AnnotationResponse>.Failure("Page not found.");
        }

        var annotation = new Annotation
        {
            PageId = pageId,
            Type = request.Type,
            CoordinatesJson = request.CoordinatesJson,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(annotation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<AnnotationResponse>.Success(ToResponse(annotation));
    }

    public async Task<Result<IReadOnlyList<AnnotationResponse>>> GetByPageAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        var annotations = await _repository.ListAsync<Annotation>(annotation => annotation.PageId == pageId, cancellationToken);
        return Result<IReadOnlyList<AnnotationResponse>>.Success(annotations.Select(ToResponse).ToArray());
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var annotation = await _repository.GetByIdAsync<Annotation>(id, cancellationToken);
        if (annotation is null)
        {
            return Result<bool>.Failure("Annotation not found.");
        }

        _repository.Remove(annotation);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }

    private static AnnotationResponse ToResponse(Annotation annotation) => new()
    {
        Id = annotation.Id,
        PageId = annotation.PageId,
        Type = annotation.Type,
        CoordinatesJson = annotation.CoordinatesJson,
        CreatedBy = annotation.CreatedBy,
        CreatedAt = annotation.CreatedAt
    };
}
