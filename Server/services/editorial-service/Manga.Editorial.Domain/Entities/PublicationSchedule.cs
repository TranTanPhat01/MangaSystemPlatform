using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Domain.Entities;

public sealed class PublicationSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SeriesId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid? IssueId { get; set; }
    public Issue? Issue { get; set; }
    public PublicationType PublicationType { get; set; }
    public DateTime ScheduledDate { get; set; }
    public PublicationStatus Status { get; set; } = PublicationStatus.Scheduled;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
}
