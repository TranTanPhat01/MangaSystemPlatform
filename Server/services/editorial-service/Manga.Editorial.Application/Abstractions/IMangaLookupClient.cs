using Manga.Editorial.Application.DTOs;

namespace Manga.Editorial.Application.Abstractions;

public interface IMangaLookupClient
{
    Task<SeriesSummaryDto?> GetSeriesByIdAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<ChapterSummaryDto?> GetChapterByIdAsync(Guid chapterId, CancellationToken cancellationToken = default);
    Task<bool> ApplyProposalDecisionAsync(Guid seriesId, string decision, string reason, CancellationToken cancellationToken = default);
    Task<(bool PageValid, bool AnnotationValid)> ValidatePageAndAnnotationAsync(Guid chapterId, Guid? pageId, Guid? annotationId, CancellationToken cancellationToken = default);
    Task<bool> UpdateSeriesStatusAsync(Guid seriesId, string status, string reason, CancellationToken cancellationToken = default);
}
