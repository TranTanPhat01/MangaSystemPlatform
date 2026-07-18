namespace Manga.Management.Domain.Entities;

public sealed class ReaderBookmark
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid? PageId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
