using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Domain.Entities;

public sealed class BoardVote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SeriesId { get; set; }
    public Guid? ProposalId { get; set; }
    public Guid VoterUserId { get; set; }
    public BoardVoteValue VoteValue { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
