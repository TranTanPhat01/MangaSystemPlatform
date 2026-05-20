using Manga.Management.Domain.Enums;

namespace Manga.Management.Domain.Entities;

public sealed class Page
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChapterId { get; set; }
    public Chapter? Chapter { get; set; }
    public int PageNumber { get; set; }
    public Guid? FileId { get; set; }
    public PageStatus Status { get; set; } = PageStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();
    public ICollection<MangaTask> Tasks { get; set; } = new List<MangaTask>();
}
