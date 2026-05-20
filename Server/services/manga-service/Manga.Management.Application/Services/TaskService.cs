using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using DomainTaskStatus = Manga.Management.Domain.Enums.TaskStatus;

namespace Manga.Management.Application.Services;

public sealed class TaskService : ITaskService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;

    public TaskService(IManagementRepository repository, IManagementUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<TaskResponse>> CreateAsync(CreateTaskRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Page>(request.PageId, cancellationToken) is null)
        {
            return Result<TaskResponse>.Failure("Page not found.");
        }

        if (await _repository.GetByIdAsync<Annotation>(request.AnnotationId, cancellationToken) is null)
        {
            return Result<TaskResponse>.Failure("Annotation not found.");
        }

        var task = new MangaTask
        {
            AnnotationId = request.AnnotationId,
            PageId = request.PageId,
            Title = request.Title.Trim(),
            Description = request.Description,
            AssignedToUserId = request.AssignedToUserId,
            CreatedByUserId = currentUserId,
            Priority = request.Priority,
            Deadline = request.Deadline,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<TaskResponse>.Success(ToResponse(task));
    }

    public async Task<Result<IReadOnlyList<TaskResponse>>> GetMineAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var tasks = await _repository.ListAsync<MangaTask>(
            task => task.AssignedToUserId == currentUserId || task.CreatedByUserId == currentUserId,
            cancellationToken);

        return Result<IReadOnlyList<TaskResponse>>.Success(tasks.Select(ToResponse).ToArray());
    }

    public async Task<Result<TaskResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
        return task is null
            ? Result<TaskResponse>.Failure("Task not found.")
            : Result<TaskResponse>.Success(ToResponse(task));
    }

    public Task<Result<TaskResponse>> StartAsync(Guid id, CancellationToken cancellationToken = default) =>
        SetStatusAsync(id, DomainTaskStatus.InProgress, cancellationToken);

    public async Task<Result<SubmissionResponse>> SubmitAsync(Guid id, SubmitTaskRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
        if (task is null)
        {
            return Result<SubmissionResponse>.Failure("Task not found.");
        }

        task.Status = DomainTaskStatus.Submitted;
        task.UpdatedAt = DateTime.UtcNow;

        var submission = new Submission
        {
            TaskId = id,
            SubmittedByUserId = currentUserId,
            FileId = request.FileId,
            Note = request.Note,
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(submission, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<SubmissionResponse>.Success(ToResponse(submission));
    }

    public Task<Result<TaskResponse>> ApproveAsync(Guid id, CancellationToken cancellationToken = default) =>
        SetStatusAsync(id, DomainTaskStatus.Approved, cancellationToken);

    public async Task<Result<TaskResponse>> RequestRevisionAsync(Guid id, RequestRevisionRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
        if (task is null)
        {
            return Result<TaskResponse>.Failure("Task not found.");
        }

        task.Status = DomainTaskStatus.RevisionRequired;
        task.UpdatedAt = DateTime.UtcNow;

        await _repository.AddAsync(new Revision
        {
            TaskId = id,
            RequestedByUserId = currentUserId,
            Reason = request.Reason.Trim(),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<TaskResponse>.Success(ToResponse(task));
    }

    private async Task<Result<TaskResponse>> SetStatusAsync(Guid id, DomainTaskStatus status, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
        if (task is null)
        {
            return Result<TaskResponse>.Failure("Task not found.");
        }

        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<TaskResponse>.Success(ToResponse(task));
    }

    private static TaskResponse ToResponse(MangaTask task) => new()
    {
        Id = task.Id,
        AnnotationId = task.AnnotationId,
        PageId = task.PageId,
        Title = task.Title,
        Description = task.Description,
        AssignedToUserId = task.AssignedToUserId,
        CreatedByUserId = task.CreatedByUserId,
        Status = task.Status,
        Priority = task.Priority,
        Deadline = task.Deadline,
        CreatedAt = task.CreatedAt,
        UpdatedAt = task.UpdatedAt
    };

    private static SubmissionResponse ToResponse(Submission submission) => new()
    {
        Id = submission.Id,
        TaskId = submission.TaskId,
        SubmittedByUserId = submission.SubmittedByUserId,
        FileId = submission.FileId,
        Note = submission.Note,
        Status = submission.Status,
        SubmittedAt = submission.SubmittedAt
    };
}
