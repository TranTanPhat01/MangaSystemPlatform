using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Application.Services;

public sealed class PublicationService : IPublicationService
{
    private readonly IEditorialRepository _repository; private readonly IEditorialUnitOfWork _unitOfWork;
    public PublicationService(IEditorialRepository repository, IEditorialUnitOfWork unitOfWork) { _repository = repository; _unitOfWork = unitOfWork; }
    public async Task<Result<IssueResponse>> CreateIssueAsync(CreateIssueRequest request, CancellationToken cancellationToken = default) { var issue = new Issue { IssueNumber = request.IssueNumber.Trim(), Title = request.Title.Trim(), ReleaseDate = request.ReleaseDate, CreatedAt = DateTime.UtcNow }; await _repository.AddAsync(issue, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken); return Result<IssueResponse>.Success(ToResponse(issue)); }
    public async Task<Result<IReadOnlyList<IssueResponse>>> GetIssuesAsync(CancellationToken cancellationToken = default) => Result<IReadOnlyList<IssueResponse>>.Success((await _repository.ListAsync<Issue>(cancellationToken: cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<IssueResponse>> GetIssueAsync(Guid id, CancellationToken cancellationToken = default) { var issue = await _repository.GetByIdAsync<Issue>(id, cancellationToken); return issue is null ? Result<IssueResponse>.Failure("Issue not found.") : Result<IssueResponse>.Success(ToResponse(issue)); }
    public async Task<Result<IssueResponse>> UpdateIssueStatusAsync(Guid id, UpdateIssueStatusRequest request, CancellationToken cancellationToken = default) { var issue = await _repository.GetByIdAsync<Issue>(id, cancellationToken); if (issue is null) return Result<IssueResponse>.Failure("Issue not found."); issue.Status = request.Status; await _unitOfWork.SaveChangesAsync(cancellationToken); return Result<IssueResponse>.Success(ToResponse(issue)); }
    public async Task<Result<PublicationScheduleResponse>> CreateScheduleAsync(CreatePublicationScheduleRequest request, CancellationToken cancellationToken = default)
    {
        var approvedReview = await _repository.ListAsync<EditorialReview>(r => r.ChapterId == request.ChapterId && r.SeriesId == request.SeriesId && r.Status == EditorialReviewStatus.Approved, cancellationToken);
        if (approvedReview.Count == 0) return Result<PublicationScheduleResponse>.Failure("Only approved/reviewed chapters can be scheduled.");
        var schedule = new PublicationSchedule { SeriesId = request.SeriesId, ChapterId = request.ChapterId, IssueId = request.IssueId, PublicationType = request.PublicationType, ScheduledDate = request.ScheduledDate, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(schedule, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken); return Result<PublicationScheduleResponse>.Success(ToResponse(schedule));
    }
    public async Task<Result<IReadOnlyList<PublicationScheduleResponse>>> GetSchedulesAsync(CancellationToken cancellationToken = default) => Result<IReadOnlyList<PublicationScheduleResponse>>.Success((await _repository.ListAsync<PublicationSchedule>(cancellationToken: cancellationToken)).Select(ToResponse).ToArray());
    public async Task<Result<PublicationScheduleResponse>> GetScheduleAsync(Guid id, CancellationToken cancellationToken = default) { var schedule = await _repository.GetByIdAsync<PublicationSchedule>(id, cancellationToken); return schedule is null ? Result<PublicationScheduleResponse>.Failure("Publication schedule not found.") : Result<PublicationScheduleResponse>.Success(ToResponse(schedule)); }
    public async Task<Result<PublicationScheduleResponse>> PublishAsync(Guid id, CancellationToken cancellationToken = default) { var schedule = await _repository.GetByIdAsync<PublicationSchedule>(id, cancellationToken); if (schedule is null) return Result<PublicationScheduleResponse>.Failure("Publication schedule not found."); schedule.Status = PublicationStatus.Published; schedule.PublishedAt = DateTime.UtcNow; await _unitOfWork.SaveChangesAsync(cancellationToken); return Result<PublicationScheduleResponse>.Success(ToResponse(schedule)); }
    public async Task<Result<PublicationScheduleResponse>> SetSeriesPublicationStatusAsync(Guid seriesId, PublicationStatus status, CancellationToken cancellationToken = default)
    {
        var schedule = new PublicationSchedule { SeriesId = seriesId, ChapterId = Guid.Empty, PublicationType = PublicationType.SpecialIssue, ScheduledDate = DateTime.UtcNow, Status = status, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(schedule, cancellationToken); await _unitOfWork.SaveChangesAsync(cancellationToken); return Result<PublicationScheduleResponse>.Success(ToResponse(schedule));
    }
    private static IssueResponse ToResponse(Issue i) => new() { Id = i.Id, IssueNumber = i.IssueNumber, Title = i.Title, ReleaseDate = i.ReleaseDate, Status = i.Status, CreatedAt = i.CreatedAt };
    private static PublicationScheduleResponse ToResponse(PublicationSchedule s) => new() { Id = s.Id, SeriesId = s.SeriesId, ChapterId = s.ChapterId, IssueId = s.IssueId, PublicationType = s.PublicationType, ScheduledDate = s.ScheduledDate, Status = s.Status, CreatedAt = s.CreatedAt, PublishedAt = s.PublishedAt };
}
