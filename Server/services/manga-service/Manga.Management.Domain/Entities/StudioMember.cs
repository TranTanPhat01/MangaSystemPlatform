namespace Manga.Management.Domain.Entities;

public sealed class StudioMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudioId { get; set; }
    public Studio? Studio { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
