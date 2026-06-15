namespace Manga.Editorial.Application.DTOs;

public sealed class SeriesSummaryDto
{
    public Guid SeriesId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid AuthorUserId { get; set; }
}

public sealed class ChapterSummaryDto
{
    public Guid ChapterId { get; set; }
    public Guid SeriesId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Number { get; set; }
    public string Status { get; set; } = string.Empty;
}
