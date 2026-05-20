using Manga.Management.Domain.Enums;

namespace Manga.Management.Domain.Entities;

public sealed class Series
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudioId { get; set; }
    public Studio? Studio { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public SeriesStatus Status { get; set; } = SeriesStatus.Draft;
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
}
