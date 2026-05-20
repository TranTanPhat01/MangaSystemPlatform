using Manga.Editorial.Application.Common;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Application.Services;

public interface IPublicationService
{
    Task<Result<IssueResponse>> CreateIssueAsync(CreateIssueRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<IssueResponse>>> GetIssuesAsync(CancellationToken cancellationToken = default);
    Task<Result<IssueResponse>> GetIssueAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<IssueResponse>> UpdateIssueStatusAsync(Guid id, UpdateIssueStatusRequest request, CancellationToken cancellationToken = default);
    Task<Result<PublicationScheduleResponse>> CreateScheduleAsync(CreatePublicationScheduleRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<PublicationScheduleResponse>>> GetSchedulesAsync(CancellationToken cancellationToken = default);
    Task<Result<PublicationScheduleResponse>> GetScheduleAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<PublicationScheduleResponse>> PublishAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<PublicationScheduleResponse>> SetSeriesPublicationStatusAsync(Guid seriesId, PublicationStatus status, CancellationToken cancellationToken = default);
}
