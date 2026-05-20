using System.ComponentModel.DataAnnotations;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Application.DTOs;

public sealed class CreateChapterRequest
{
    [Range(1, int.MaxValue)]
    public int ChapterNumber { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;
    public DateTime? Deadline { get; set; }
}

public sealed class UpdateChapterStatusRequest
{
    [Required]
    public ChapterStatus Status { get; set; }
}

public sealed class ChapterResponse
{
    public Guid Id { get; set; }
    public Guid SeriesId { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public ChapterStatus Status { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
