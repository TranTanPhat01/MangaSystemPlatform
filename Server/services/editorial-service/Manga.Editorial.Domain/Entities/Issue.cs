using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Domain.Entities;

public sealed class Issue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string IssueNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; }
    public IssueStatus Status { get; set; } = IssueStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<PublicationSchedule> PublicationSchedules { get; set; } = new List<PublicationSchedule>();
}
