namespace Manga.Management.Application.Services;

public interface IManagementAccessService
{
    bool IsAdministrator { get; }
    bool CanViewBoardData { get; }
    Task<bool> CanAccessStudioAsync(Guid studioId, CancellationToken cancellationToken = default);
    Task<bool> CanManageStudioAsync(Guid studioId, CancellationToken cancellationToken = default);
    Task<bool> CanAccessSeriesAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<bool> CanManageSeriesAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<bool> CanAccessChapterAsync(Guid chapterId, CancellationToken cancellationToken = default);
    Task<bool> CanManageChapterAsync(Guid chapterId, CancellationToken cancellationToken = default);
    Task<bool> CanAccessPageAsync(Guid pageId, CancellationToken cancellationToken = default);
    Task<bool> CanManagePageAsync(Guid pageId, CancellationToken cancellationToken = default);
    Task<bool> CanAccessAnnotationAsync(Guid annotationId, CancellationToken cancellationToken = default);
    Task<bool> CanManageAnnotationAsync(Guid annotationId, CancellationToken cancellationToken = default);
    Task<bool> CanAccessTaskAsync(Guid taskId, CancellationToken cancellationToken = default);
    Task<bool> CanWorkTaskAsync(Guid taskId, CancellationToken cancellationToken = default);
}
