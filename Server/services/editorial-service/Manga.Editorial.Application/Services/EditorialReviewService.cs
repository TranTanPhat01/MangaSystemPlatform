using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;

namespace Manga.Editorial.Application.Services;

public sealed class EditorialReviewService : IEditorialReviewService
{
    private readonly IEditorialRepository _repository;
    private readonly IEditorialUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IEventBus _eventBus;
    private readonly IMangaLookupClient _mangaLookupClient;

    public EditorialReviewService(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork, ICurrentUserService currentUser, IEventBus eventBus, IMangaLookupClient mangaLookupClient)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _eventBus = eventBus;
        _mangaLookupClient = mangaLookupClient;
    }

    public async Task<Result<EditorialReviewResponse>> CreateAsync(CreateEditorialReviewRequest request, CancellationToken cancellationToken = default)
    {
        var chapter = await _mangaLookupClient.GetChapterByIdAsync(request.ChapterId, cancellationToken);
        if (chapter is null) return Result<EditorialReviewResponse>.Failure("Chapter not found.");
        var series = await _mangaLookupClient.GetSeriesByIdAsync(request.SeriesId, cancellationToken);
        if (series is null) return Result<EditorialReviewResponse>.Failure("Series not found.");
        if (chapter.SeriesId != request.SeriesId) return Result<EditorialReviewResponse>.Failure("Chapter does not belong to series.");
        if (!_currentUser.IsInRole("Admin") && series.AuthorUserId != _currentUser.UserId) return Result<EditorialReviewResponse>.Failure("You do not have permission to request a review for this series.");

        var existingReview = (await _repository.ListAsync<EditorialReview>(review => review.ChapterId == request.ChapterId, cancellationToken)).FirstOrDefault();
        if (existingReview is not null) return Result<EditorialReviewResponse>.Failure("A review already exists for this chapter.");

        var review = new EditorialReview
        {
            ChapterId = request.ChapterId,
            SeriesId = request.SeriesId,
            RequestedByUserId = _currentUser.UserId,
            ReviewerUserId = request.ReviewerUserId,
            CreatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(review, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<EditorialReviewResponse>.Success(ToResponse(review));
    }

    public async Task<Result<IReadOnlyList<EditorialReviewResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var reviews = await _repository.ListAsync<EditorialReview>(cancellationToken: cancellationToken);
        if (_currentUser.IsInRole("TantouEditor"))
        {
            reviews = reviews.Where(review => review.ReviewerUserId == _currentUser.UserId || review.Status == EditorialReviewStatus.Pending).ToArray();
        }
        else if (!_currentUser.IsInRole("Admin") && !_currentUser.IsInRole("EditorialBoard"))
        {
            reviews = reviews.Where(review => review.RequestedByUserId == _currentUser.UserId).ToArray();
        }

        var responses = new List<EditorialReviewResponse>();
        foreach (var review in reviews.OrderByDescending(review => review.CreatedAt)) responses.Add(await ToResponseAsync(review, cancellationToken));
        return Result<IReadOnlyList<EditorialReviewResponse>>.Success(responses);
    }

    public async Task<Result<EditorialReviewResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _repository.GetByIdAsync<EditorialReview>(id, cancellationToken);
        return review is null || !CanView(review)
            ? Result<EditorialReviewResponse>.Failure("Review not found.")
            : Result<EditorialReviewResponse>.Success(await ToResponseAsync(review, cancellationToken));
    }

    public async Task<Result<EditorialReviewResponse>> StartReviewAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _repository.GetByIdAsync<EditorialReview>(id, cancellationToken);
        if (review is null || !CanReview(review)) return Result<EditorialReviewResponse>.Failure("Review not found.");
        if (review.Status is not (EditorialReviewStatus.Pending or EditorialReviewStatus.RevisionRequested)) return Result<EditorialReviewResponse>.Failure("Review cannot be started in its current status.");

        review.ReviewerUserId ??= _currentUser.UserId;
        review.Status = EditorialReviewStatus.InReview;
        review.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<EditorialReviewResponse>.Success(await ToResponseAsync(review, cancellationToken));
    }

    public async Task<Result<EditorialCommentResponse>> AddCommentAsync(Guid reviewId, CreateEditorialCommentRequest request, CancellationToken cancellationToken = default)
    {
        var review = await _repository.GetByIdAsync<EditorialReview>(reviewId, cancellationToken);
        if (review is null || !CanReview(review)) return Result<EditorialCommentResponse>.Failure("Review not found.");
        if (review.Status is EditorialReviewStatus.Approved or EditorialReviewStatus.Rejected) return Result<EditorialCommentResponse>.Failure("Comments cannot be added to a completed review.");
        if (string.IsNullOrWhiteSpace(request.CommentText)) return Result<EditorialCommentResponse>.Failure("Comment text is required.");

        review.ReviewerUserId ??= _currentUser.UserId;
        if (review.Status == EditorialReviewStatus.Pending) review.Status = EditorialReviewStatus.InReview;
        review.UpdatedAt = DateTime.UtcNow;
        var comment = new EditorialComment { ReviewId = reviewId, PageId = request.PageId, AnnotationId = request.AnnotationId, CommentText = request.CommentText.Trim(), CreatedByUserId = _currentUser.UserId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<EditorialCommentResponse>.Success(ToResponse(comment));
    }

    public async Task<Result<IReadOnlyList<EditorialCommentResponse>>> GetCommentsAsync(Guid reviewId, CancellationToken cancellationToken = default)
    {
        var review = await _repository.GetByIdAsync<EditorialReview>(reviewId, cancellationToken);
        if (review is null || !CanView(review)) return Result<IReadOnlyList<EditorialCommentResponse>>.Failure("Review not found.");
        var comments = await _repository.ListAsync<EditorialComment>(comment => comment.ReviewId == reviewId, cancellationToken);
        return Result<IReadOnlyList<EditorialCommentResponse>>.Success(comments.OrderByDescending(comment => comment.CreatedAt).Select(ToResponse).ToArray());
    }

    public Task<Result<EditorialReviewResponse>> ApproveAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default) => SetStatusAsync(id, EditorialReviewStatus.Approved, request.DecisionNote, cancellationToken);
    public Task<Result<EditorialReviewResponse>> RequestRevisionAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default) => SetStatusAsync(id, EditorialReviewStatus.RevisionRequested, request.DecisionNote, cancellationToken);
    public Task<Result<EditorialReviewResponse>> RejectAsync(Guid id, DecisionRequest request, CancellationToken cancellationToken = default) => SetStatusAsync(id, EditorialReviewStatus.Rejected, request.DecisionNote, cancellationToken);

    private async Task<Result<EditorialReviewResponse>> SetStatusAsync(Guid id, EditorialReviewStatus status, string? note, CancellationToken cancellationToken)
    {
        var review = await _repository.GetByIdAsync<EditorialReview>(id, cancellationToken);
        if (review is null) return Result<EditorialReviewResponse>.Failure("Review not found.");
        if (!CanReview(review)) return Result<EditorialReviewResponse>.Failure("You are not assigned to this review.");
        if (review.Status != EditorialReviewStatus.InReview) return Result<EditorialReviewResponse>.Failure("Review must be in progress before a decision can be made.");
        if (status is EditorialReviewStatus.RevisionRequested or EditorialReviewStatus.Rejected && string.IsNullOrWhiteSpace(note)) return Result<EditorialReviewResponse>.Failure("A decision reason is required.");

        review.Status = status;
        review.ReviewerUserId ??= _currentUser.UserId;
        review.DecisionNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        review.UpdatedAt = DateTime.UtcNow;
        if (status == EditorialReviewStatus.Approved)
        {
            await _eventBus.PublishAsync(new ChapterApprovedEvent(Guid.NewGuid(), review.ChapterId, review.SeriesId, review.RequestedByUserId, _currentUser.UserId, DateTime.UtcNow), cancellationToken);
        }
        else
        {
            await _eventBus.PublishAsync(new ChapterReviewDecisionEvent(Guid.NewGuid(), review.ChapterId, review.SeriesId, review.RequestedByUserId, _currentUser.UserId, status.ToString(), review.DecisionNote!, DateTime.UtcNow), cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<EditorialReviewResponse>.Success(await ToResponseAsync(review, cancellationToken));
    }

    private async Task<EditorialReviewResponse> ToResponseAsync(EditorialReview review, CancellationToken cancellationToken)
    {
        var latestComment = (await _repository.ListAsync<EditorialComment>(comment => comment.ReviewId == review.Id, cancellationToken)).OrderByDescending(comment => comment.CreatedAt).FirstOrDefault();
        return ToResponse(review, latestComment);
    }

    private static EditorialReviewResponse ToResponse(EditorialReview review, EditorialComment? latestComment = null) => new() { Id = review.Id, ChapterId = review.ChapterId, SeriesId = review.SeriesId, RequestedByUserId = review.RequestedByUserId, ReviewerUserId = review.ReviewerUserId, Status = review.Status, DecisionNote = review.DecisionNote, CreatedAt = review.CreatedAt, UpdatedAt = review.UpdatedAt, LatestComment = latestComment is null ? null : ToResponse(latestComment) };
    private bool CanView(EditorialReview review) => _currentUser.IsInRole("Admin") || _currentUser.IsInRole("EditorialBoard") || (_currentUser.IsInRole("TantouEditor") && (review.Status == EditorialReviewStatus.Pending || review.ReviewerUserId == _currentUser.UserId)) || review.RequestedByUserId == _currentUser.UserId;
    private bool CanReview(EditorialReview review) => _currentUser.IsInRole("Admin") || (_currentUser.IsInRole("TantouEditor") && (!review.ReviewerUserId.HasValue || review.ReviewerUserId == _currentUser.UserId));
    private static EditorialCommentResponse ToResponse(EditorialComment comment) => new() { Id = comment.Id, ReviewId = comment.ReviewId, PageId = comment.PageId, AnnotationId = comment.AnnotationId, CommentText = comment.CommentText, CreatedByUserId = comment.CreatedByUserId, IsResolved = comment.IsResolved, CreatedAt = comment.CreatedAt, ResolvedAt = comment.ResolvedAt };
}
