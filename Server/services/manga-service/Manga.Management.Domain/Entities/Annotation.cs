using Manga.Management.Domain.Enums;

namespace Manga.Management.Domain.Entities;

public sealed class Annotation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PageId { get; set; }
    public Page? Page { get; set; }
    public AnnotationType Type { get; set; }
    public string CoordinatesJson { get; set; } = string.Empty;
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MangaTask> Tasks { get; set; } = new List<MangaTask>();
}
