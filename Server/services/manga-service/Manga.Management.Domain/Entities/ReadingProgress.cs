namespace Manga.Management.Domain.Entities;

public sealed class ReadingProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid SeriesId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid? PageId { get; set; }
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
}
