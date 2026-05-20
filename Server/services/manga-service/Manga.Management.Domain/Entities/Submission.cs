using Manga.Management.Domain.Enums;

namespace Manga.Management.Domain.Entities;

public sealed class Submission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public MangaTask? Task { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public Guid? FileId { get; set; }
    public string? Note { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
