using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Application.Services;

public sealed class EditorialReviewService : IEditorialReviewService
{
    private readonly IEditorialRepository _repository;
    private readonly IEditorialUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public EditorialReviewService(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result<EditorialReviewResponse>> CreateAsync(CreateEditorialReviewRequest request, CancellationToken cancellationToken = default)
    {
        var review = new EditorialReview { ChapterId = request.ChapterId, SeriesId = request.SeriesId, RequestedByUserId = _currentUser.UserId, ReviewerUserId = request.ReviewerUserId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(review, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<EditorialReviewResponse>.Success(ToResponse(review));
    }

    public async Task<Result<IReadOnlyList<EditorialReviewResponse>>> GetAllAsync(CancellationToken cancellationToken = default) =>
        Result<IReadOnlyList<EditorialReviewResponse>>.Success((await _repository.ListAsync<EditorialReview>(cancellationToken: cancellationToken)).Select(ToResponse).ToArray());

    public async Task<Result<EditorialReviewResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _repository.GetByIdAsync<EditorialReview>(id, cancellationToken);
        return review is null ? Result<EditorialReviewResponse>.Failure("Review not found.") : Result<EditorialReviewResponse>.Success(ToResponse(review));
    }

    public async Task<Result<EditorialCommentResponse>> AddCommentAsync(Guid reviewId, CreateEditorialCommentRequest request, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<EditorialReview>(reviewId, cancellationToken) is null) return Result<EditorialCommentResponse>.Failure("Review not found.");
        var comment = new EditorialComment { ReviewId = reviewId, PageId = request.PageId, AnnotationId = request.AnnotationId, CommentText = request.CommentText.Trim(), CreatedByUserId = _currentUser.UserId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<EditorialCommentResponse>.Success(ToResponse(comment));
    }

    public async Task<Result<IReadOnlyList<EditorialCommentResponse>>> GetCommentsAsync(Guid reviewId, CancellationToken cancellationToken = default) =>
        Result<IReadOnlyList<EditorialCommentResponse>>.Success((await _repository.ListAsync<EditorialComment>(c => c.ReviewId == reviewId, cancellationToken)).Select(ToResponse).ToArray());

    public Task<Result<EditorialReviewResponse>> ApproveAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default) => SetStatusAsync(id, EditorialReviewStatus.Approved, request.DecisionNote, cancellationToken);
    public Task<Result<EditorialReviewResponse>> RequestRevisionAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default) => SetStatusAsync(id, EditorialReviewStatus.RevisionRequested, request.DecisionNote, cancellationToken);
    public Task<Result<EditorialReviewResponse>> RejectAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default) => SetStatusAsync(id, EditorialReviewStatus.Rejected, request.DecisionNote, cancellationToken);

    private async Task<Result<EditorialReviewResponse>> SetStatusAsync(Guid id, EditorialReviewStatus status, string? note, CancellationToken cancellationToken)
    {
        var review = await _repository.GetByIdAsync<EditorialReview>(id, cancellationToken);
        if (review is null) return Result<EditorialReviewResponse>.Failure("Review not found.");
        review.Status = status;
        review.ReviewerUserId ??= _currentUser.UserId;
        review.DecisionNote = note;
        review.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<EditorialReviewResponse>.Success(ToResponse(review));
    }

    private static EditorialReviewResponse ToResponse(EditorialReview r) => new() { Id = r.Id, ChapterId = r.ChapterId, SeriesId = r.SeriesId, RequestedByUserId = r.RequestedByUserId, ReviewerUserId = r.ReviewerUserId, Status = r.Status, DecisionNote = r.DecisionNote, CreatedAt = r.CreatedAt, UpdatedAt = r.UpdatedAt };
    private static EditorialCommentResponse ToResponse(EditorialComment c) => new() { Id = c.Id, ReviewId = c.ReviewId, PageId = c.PageId, AnnotationId = c.AnnotationId, CommentText = c.CommentText, CreatedByUserId = c.CreatedByUserId, IsResolved = c.IsResolved, CreatedAt = c.CreatedAt, ResolvedAt = c.ResolvedAt };
}
