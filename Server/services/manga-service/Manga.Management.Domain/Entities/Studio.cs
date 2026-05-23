namespace Manga.Management.Domain.Entities;

public sealed class Studio
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<StudioMember> Members { get; set; } = new List<StudioMember>();
    public ICollection<Series> Series { get; set; } = new List<Series>();
}
