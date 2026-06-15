using Manga.Editorial.Application.DTOs;

namespace Manga.Editorial.Application.Abstractions;

public interface IMangaLookupClient
{
    Task<SeriesSummaryDto?> GetSeriesByIdAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<ChapterSummaryDto?> GetChapterByIdAsync(Guid chapterId, CancellationToken cancellationToken = default);
}
