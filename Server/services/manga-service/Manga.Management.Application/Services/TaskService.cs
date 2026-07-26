using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using DomainTaskStatus = Manga.Management.Domain.Enums.TaskStatus;

namespace Manga.Management.Application.Services;

public sealed class TaskService : ITaskService
{
    private static readonly SemaphoreSlim ConcurrencySemaphore = new(1, 1);
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly IEventBus _eventBus;
    private readonly IIdentityLookupClient _identityLookupClient;
    private readonly IFileLookupClient _fileLookupClient;
    private readonly IManagementAccessService _access;

    public TaskService(IManagementRepository repository, IManagementUnitOfWork unitOfWork, IEventBus eventBus, IIdentityLookupClient identityLookupClient, IFileLookupClient fileLookupClient, IManagementAccessService access)
    { _repository = repository; _unitOfWork = unitOfWork; _eventBus = eventBus; _identityLookupClient = identityLookupClient; _fileLookupClient = fileLookupClient; _access = access; }

    public async Task<Result<TaskResponse>> CreateAsync(CreateTaskRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var page = await _repository.GetByIdAsync<Page>(request.PageId, cancellationToken);
        if (page is null) return Result<TaskResponse>.Failure("Page not found.");
        if (!await _access.CanManagePageAsync(request.PageId, cancellationToken)) return Result<TaskResponse>.Failure("You do not have permission to create tasks for this page.");
        var annotation = await _repository.GetByIdAsync<Annotation>(request.AnnotationId, cancellationToken);
        if (annotation is null || annotation.PageId != request.PageId) return Result<TaskResponse>.Failure("Annotation does not belong to the task page.");
        if (!await _identityLookupClient.CheckUserExistsAsync(request.AssignedToUserId, cancellationToken)) return Result<TaskResponse>.Failure("Assigned user does not exist or is inactive.");
        if (!await _identityLookupClient.CheckUserRoleAsync(request.AssignedToUserId, "Assistant", cancellationToken)) return Result<TaskResponse>.Failure("Assigned user must have Assistant role.");

        var task = new MangaTask { AnnotationId = request.AnnotationId, PageId = request.PageId, Title = request.Title.Trim(), Description = request.Description, AssignedToUserId = request.AssignedToUserId, CreatedByUserId = currentUserId, Priority = request.Priority, Deadline = request.Deadline, Status = DomainTaskStatus.Todo, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(task, cancellationToken);
        await _eventBus.PublishAsync(new TaskAssignedEvent(Guid.NewGuid(), task.Id, task.PageId, task.AssignedToUserId, task.CreatedByUserId, task.CreatedAt), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<TaskResponse>.Success(await ToResponseAsync(task, cancellationToken));
    }

    public async Task<Result<IReadOnlyList<TaskResponse>>> GetMineAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var tasks = await _repository.ListAsync<MangaTask>(task => task.AssignedToUserId == currentUserId || task.CreatedByUserId == currentUserId, cancellationToken);
        return Result<IReadOnlyList<TaskResponse>>.Success(await Task.WhenAll(tasks.Select(task => ToResponseAsync(task, cancellationToken))));
    }

    public async Task<Result<TaskResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
        return task is null || !await _access.CanAccessTaskAsync(id, cancellationToken) ? Result<TaskResponse>.Failure("Task not found.") : Result<TaskResponse>.Success(await ToResponseAsync(task, cancellationToken));
    }

    public async Task<Result<TaskResponse>> StartAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await ConcurrencySemaphore.WaitAsync(cancellationToken);
        try
        {
            var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
            if (task is null) return Result<TaskResponse>.Failure("Task not found.");
            if (!await _access.CanWorkTaskAsync(id, cancellationToken)) return Result<TaskResponse>.Failure("You do not have permission to start this task.");
            if (task.Status is not (DomainTaskStatus.Todo or DomainTaskStatus.RevisionRequired)) return Result<TaskResponse>.Failure("Only assigned or revision-requested tasks can be started.");
            task.Status = DomainTaskStatus.InProgress; task.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<TaskResponse>.Success(await ToResponseAsync(task, cancellationToken));
        }
        finally
        {
            ConcurrencySemaphore.Release();
        }
    }

    public async Task<Result<SubmissionResponse>> SubmitAsync(Guid id, SubmitTaskRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        await ConcurrencySemaphore.WaitAsync(cancellationToken);
        try
        {
            var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
            if (task is null) return Result<SubmissionResponse>.Failure("Task not found.");
            if (!await _access.CanWorkTaskAsync(id, cancellationToken)) return Result<SubmissionResponse>.Failure("You do not have permission to submit this task.");
            
            if (task.Status == DomainTaskStatus.Submitted)
            {
                return Result<SubmissionResponse>.Failure("Task is already submitted.");
            }

            if (task.Status != DomainTaskStatus.InProgress)
            {
                return Result<SubmissionResponse>.Failure("Only in-progress tasks can be submitted.");
            }

            if (!request.FileId.HasValue) return Result<SubmissionResponse>.Failure("A submission file is required.");
            if (!await _fileLookupClient.FileExistsAsync(request.FileId.Value, cancellationToken)) return Result<SubmissionResponse>.Failure("File does not exist or is not accessible.");

            task.Status = DomainTaskStatus.Submitted; task.UpdatedAt = DateTime.UtcNow;
            var submission = new Submission { TaskId = id, SubmittedByUserId = currentUserId, FileId = request.FileId, Note = request.Note, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow };
            await _repository.AddAsync(submission, cancellationToken);
            await _eventBus.PublishAsync(new TaskSubmittedEvent(Guid.NewGuid(), task.Id, currentUserId, request.FileId, submission.SubmittedAt), cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<SubmissionResponse>.Success(ToResponse(submission));
        }
        finally
        {
            ConcurrencySemaphore.Release();
        }
    }

    public async Task<Result<TaskResponse>> ApproveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await ConcurrencySemaphore.WaitAsync(cancellationToken);
        try
        {
            var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
            if (task is null) return Result<TaskResponse>.Failure("Task not found.");
            if (!await _access.CanManagePageAsync(task.PageId, cancellationToken)) return Result<TaskResponse>.Failure("You do not have permission to approve this task.");
            
            if (task.Status == DomainTaskStatus.Approved)
            {
                return Result<TaskResponse>.Failure("Task is already approved.");
            }

            if (task.Status != DomainTaskStatus.Submitted) return Result<TaskResponse>.Failure("Only submitted tasks can be approved.");
            
            var submission = await GetLatestSubmissionAsync(id, cancellationToken);
            if (submission is null) return Result<TaskResponse>.Failure("No submission found to approve.");

            task.Status = DomainTaskStatus.Approved;
            task.ApprovedSubmissionId = submission.Id;
            task.UpdatedAt = DateTime.UtcNow;
            submission.Status = SubmissionStatus.Approved;
            await _eventBus.PublishAsync(new TaskApprovedEvent(Guid.NewGuid(), id, task.CreatedByUserId, submission.Id, DateTime.UtcNow), cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<TaskResponse>.Success(await ToResponseAsync(task, cancellationToken));
        }
        finally
        {
            ConcurrencySemaphore.Release();
        }
    }

    public async Task<Result<TaskResponse>> RequestRevisionAsync(Guid id, RequestRevisionRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        await ConcurrencySemaphore.WaitAsync(cancellationToken);
        try
        {
            var task = await _repository.GetByIdAsync<MangaTask>(id, cancellationToken);
            if (task is null) return Result<TaskResponse>.Failure("Task not found.");
            if (!await _access.CanManagePageAsync(task.PageId, cancellationToken)) return Result<TaskResponse>.Failure("You do not have permission to request a revision.");
            
            if (task.Status == DomainTaskStatus.RevisionRequired)
            {
                return Result<TaskResponse>.Failure("Revision is already requested for this task.");
            }

            if (task.Status != DomainTaskStatus.Submitted) return Result<TaskResponse>.Failure("Only submitted tasks can be sent for revision.");
            if (string.IsNullOrWhiteSpace(request.Reason)) return Result<TaskResponse>.Failure("Revision reason is required.");
            
            var submission = await GetLatestSubmissionAsync(id, cancellationToken);
            if (submission is null) return Result<TaskResponse>.Failure("No submission found to request revision.");

            task.Status = DomainTaskStatus.RevisionRequired; task.UpdatedAt = DateTime.UtcNow;
            submission.Status = SubmissionStatus.RevisionRequired;
            await _repository.AddAsync(new Revision { TaskId = id, RequestedByUserId = currentUserId, Reason = request.Reason.Trim(), CreatedAt = DateTime.UtcNow }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<TaskResponse>.Success(await ToResponseAsync(task, cancellationToken));
        }
        finally
        {
            ConcurrencySemaphore.Release();
        }
    }

    private async Task<Submission?> GetLatestSubmissionAsync(Guid taskId, CancellationToken cancellationToken) =>
        (await _repository.ListAsync<Submission>(submission => submission.TaskId == taskId, cancellationToken))
            .OrderByDescending(submission => submission.SubmittedAt)
            .ThenByDescending(submission => submission.Id)
            .FirstOrDefault();

    private async Task<TaskResponse> ToResponseAsync(MangaTask task, CancellationToken cancellationToken)
    {
        var page = await _repository.GetByIdAsync<Page>(task.PageId, cancellationToken);
        var submissions = await _repository.ListAsync<Submission>(submission => submission.TaskId == task.Id, cancellationToken);
        var revisions = await _repository.ListAsync<Revision>(revision => revision.TaskId == task.Id, cancellationToken);
        return new TaskResponse { Id = task.Id, AnnotationId = task.AnnotationId, PageId = task.PageId, PageNumber = page?.PageNumber ?? 0, PageFileId = page?.FileId, Title = task.Title, Description = task.Description, AssignedToUserId = task.AssignedToUserId, CreatedByUserId = task.CreatedByUserId, Status = task.Status, Priority = task.Priority, Deadline = task.Deadline, CreatedAt = task.CreatedAt, UpdatedAt = task.UpdatedAt, ApprovedSubmissionId = task.ApprovedSubmissionId, LatestSubmission = submissions.OrderByDescending(submission => submission.SubmittedAt).ThenByDescending(submission => submission.Id).Select(ToResponse).FirstOrDefault(), SubmissionHistory = submissions.OrderByDescending(submission => submission.SubmittedAt).ThenByDescending(submission => submission.Id).Select(ToResponse).ToArray(), Revisions = revisions.OrderByDescending(revision => revision.CreatedAt).Select(revision => new RevisionResponse { Id = revision.Id, TaskId = revision.TaskId, RequestedByUserId = revision.RequestedByUserId, Reason = revision.Reason, CreatedAt = revision.CreatedAt }).ToArray() };
    }

    private static SubmissionResponse ToResponse(Submission submission) => new() { Id = submission.Id, TaskId = submission.TaskId, SubmittedByUserId = submission.SubmittedByUserId, FileId = submission.FileId, Note = submission.Note, Status = submission.Status, SubmittedAt = submission.SubmittedAt };
}
