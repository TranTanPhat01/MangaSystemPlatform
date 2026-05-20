using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;

namespace Manga.Editorial.Application.Services;

public interface IEditorialReviewService
{
    Task<Result<EditorialReviewResponse>> CreateAsync(CreateEditorialReviewRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<EditorialReviewResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<EditorialReviewResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<EditorialCommentResponse>> AddCommentAsync(Guid reviewId, CreateEditorialCommentRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<EditorialCommentResponse>>> GetCommentsAsync(Guid reviewId, CancellationToken cancellationToken = default);
    Task<Result<EditorialReviewResponse>> ApproveAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default);
    Task<Result<EditorialReviewResponse>> RequestRevisionAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default);
    Task<Result<EditorialReviewResponse>> RejectAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default);
}
