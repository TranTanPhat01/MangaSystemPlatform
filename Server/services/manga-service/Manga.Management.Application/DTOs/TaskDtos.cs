using System.ComponentModel.DataAnnotations;
using Manga.Management.Domain.Enums;
using DomainTaskStatus = Manga.Management.Domain.Enums.TaskStatus;

namespace Manga.Management.Application.DTOs;

public sealed class CreateTaskRequest
{
    [Required]
    public Guid AnnotationId { get; set; }

    [Required]
    public Guid PageId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    [Required]
    public Guid AssignedToUserId { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? Deadline { get; set; }
}

public sealed class SubmitTaskRequest
{
    public Guid? FileId { get; set; }
    public string? Note { get; set; }
}

public sealed class RequestRevisionRequest
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}

public sealed class TaskResponse
{
    public Guid Id { get; set; }
    public Guid AnnotationId { get; set; }
    public Guid PageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid AssignedToUserId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DomainTaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class SubmissionResponse
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public Guid? FileId { get; set; }
    public string? Note { get; set; }
    public SubmissionStatus Status { get; set; }
    public DateTime SubmittedAt { get; set; }
}
