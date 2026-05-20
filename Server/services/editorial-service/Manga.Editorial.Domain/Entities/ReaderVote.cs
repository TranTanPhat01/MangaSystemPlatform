namespace Manga.Editorial.Domain.Entities;

public sealed class ReaderVote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IssueId { get; set; }
    public Guid SeriesId { get; set; }
    public int VoteCount { get; set; }
    public int? RankPosition { get; set; }
    public Guid ImportedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
