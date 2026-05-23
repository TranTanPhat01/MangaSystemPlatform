namespace Manga.Editorial.Domain.Entities;

public sealed class RankingItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RankingSnapshotId { get; set; }
    public RankingSnapshot? RankingSnapshot { get; set; }
    public Guid SeriesId { get; set; }
    public int VoteCount { get; set; }
    public int RankPosition { get; set; }
    public decimal Score { get; set; }
}
