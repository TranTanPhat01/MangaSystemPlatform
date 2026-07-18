using System.ComponentModel.DataAnnotations;

namespace Manga.Management.Application.DTOs;

public sealed class CreateBookmarkRequest { [Required] public Guid ChapterId { get; set; } public Guid? PageId { get; set; } }
public sealed class SaveReadingProgressRequest { [Required] public Guid SeriesId { get; set; } [Required] public Guid ChapterId { get; set; } public Guid? PageId { get; set; } public bool AllowBackward { get; set; } }
public sealed class UpsertRatingRequest { [Range(1, 5)] public int Value { get; set; } }
public sealed class CreateCommentRequest { [Required, StringLength(2000, MinimumLength = 1)] public string Content { get; set; } = string.Empty; }
public sealed class UpdateCommentRequest { [Required, StringLength(2000, MinimumLength = 1)] public string Content { get; set; } = string.Empty; }
public sealed class ReaderFavoriteResponse { public Guid Id { get; set; } public Guid SeriesId { get; set; } public DateTime CreatedAt { get; set; } }
public sealed class ReaderBookmarkResponse { public Guid Id { get; set; } public Guid ChapterId { get; set; } public Guid? PageId { get; set; } public DateTime CreatedAt { get; set; } }
public sealed class ReadingProgressResponse { public Guid SeriesId { get; set; } public Guid ChapterId { get; set; } public Guid? PageId { get; set; } public DateTime LastReadAt { get; set; } }
public sealed class RatingSummaryResponse { public Guid SeriesId { get; set; } public double Average { get; set; } public int Count { get; set; } }
public sealed class ReaderCommentResponse { public Guid Id { get; set; } public Guid UserId { get; set; } public Guid? SeriesId { get; set; } public Guid? ChapterId { get; set; } public string Content { get; set; } = string.Empty; public DateTime CreatedAt { get; set; } public DateTime? UpdatedAt { get; set; } }
public sealed class ReaderActivitySummaryResponse { public int FavoriteCount { get; set; } public int BookmarkCount { get; set; } public int HistoryCount { get; set; } public int RatingCount { get; set; } public int CommentCount { get; set; } }
