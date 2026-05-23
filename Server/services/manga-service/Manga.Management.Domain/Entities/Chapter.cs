using Manga.Management.Domain.Enums;

namespace Manga.Management.Domain.Entities;

public sealed class Chapter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SeriesId { get; set; }
    public Series? Series { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public ChapterStatus Status { get; set; } = ChapterStatus.Draft;
    public DateTime? Deadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Page> Pages { get; set; } = new List<Page>();
}
