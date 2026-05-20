namespace Manga.Management.Domain.Entities;

public sealed class Revision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public MangaTask? Task { get; set; }
    public Guid RequestedByUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
