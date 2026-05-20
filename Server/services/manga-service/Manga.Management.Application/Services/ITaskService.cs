using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Services;

public interface ITaskService
{
    Task<Result<TaskResponse>> CreateAsync(CreateTaskRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<TaskResponse>>> GetMineAsync(Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<TaskResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<TaskResponse>> StartAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<SubmissionResponse>> SubmitAsync(Guid id, SubmitTaskRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<TaskResponse>> ApproveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<TaskResponse>> RequestRevisionAsync(Guid id, RequestRevisionRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
}
