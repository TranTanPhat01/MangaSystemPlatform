namespace Manga.Management.Domain.Entities;

public sealed class ReaderFavorite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid SeriesId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
