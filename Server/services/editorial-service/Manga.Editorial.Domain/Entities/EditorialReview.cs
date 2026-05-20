using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Domain.Entities;

public sealed class EditorialReview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChapterId { get; set; }
    public Guid SeriesId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public Guid? ReviewerUserId { get; set; }
    public EditorialReviewStatus Status { get; set; } = EditorialReviewStatus.Pending;
    public string? DecisionNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<EditorialComment> Comments { get; set; } = new List<EditorialComment>();
}
