namespace Manga.Editorial.Domain.Entities;

public sealed class EditorialComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReviewId { get; set; }
    public EditorialReview? Review { get; set; }
    public Guid? PageId { get; set; }
    public Guid? AnnotationId { get; set; }
    public string CommentText { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public bool IsResolved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
}
