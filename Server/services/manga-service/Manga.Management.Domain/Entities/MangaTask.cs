using Manga.Management.Domain.Enums;
using DomainTaskStatus = Manga.Management.Domain.Enums.TaskStatus;

namespace Manga.Management.Domain.Entities;

public sealed class MangaTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AnnotationId { get; set; }
    public Annotation? Annotation { get; set; }
    public Guid PageId { get; set; }
    public Page? Page { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid AssignedToUserId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DomainTaskStatus Status { get; set; } = DomainTaskStatus.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? Deadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    public ICollection<Revision> Revisions { get; set; } = new List<Revision>();
}
