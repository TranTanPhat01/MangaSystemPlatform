namespace Manga.Editorial.Domain.Entities;

public sealed class RankingSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IssueId { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public Guid GeneratedByUserId { get; set; }
    public ICollection<RankingItem> Items { get; set; } = new List<RankingItem>();
}
