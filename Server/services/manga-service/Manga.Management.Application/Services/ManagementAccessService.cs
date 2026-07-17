using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class ManagementAccessService : IManagementAccessService
{
    private readonly IManagementRepository _repository;
    private readonly ICurrentUserService _currentUser;

    public ManagementAccessService(IManagementRepository repository, ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    public bool IsAdministrator => _currentUser.IsInRole("Admin");
    public bool CanViewBoardData => IsAdministrator || _currentUser.IsInRole("EditorialBoard");

    public async Task<bool> CanAccessStudioAsync(Guid studioId, CancellationToken cancellationToken = default)
    {
        if (IsAdministrator || CanViewBoardData) return true;
        var studio = await _repository.GetByIdAsync<Studio>(studioId, cancellationToken);
        return studio is not null && (studio.OwnerId == _currentUser.UserId ||
            (await _repository.ListAsync<StudioMember>(member => member.StudioId == studioId && member.UserId == _currentUser.UserId, cancellationToken)).Count > 0);
    }

    public async Task<bool> CanManageStudioAsync(Guid studioId, CancellationToken cancellationToken = default)
    {
        if (IsAdministrator) return true;
        var studio = await _repository.GetByIdAsync<Studio>(studioId, cancellationToken);
        return studio?.OwnerId == _currentUser.UserId;
    }

    public async Task<bool> CanAccessSeriesAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        if (IsAdministrator || CanViewBoardData) return true;
        var series = await _repository.GetByIdAsync<Series>(seriesId, cancellationToken);
        return series is not null && (series.CreatedBy == _currentUser.UserId || await CanAccessStudioAsync(series.StudioId, cancellationToken));
    }

    public async Task<bool> CanManageSeriesAsync(Guid seriesId, CancellationToken cancellationToken = default)
    {
        if (IsAdministrator) return true;
        var series = await _repository.GetByIdAsync<Series>(seriesId, cancellationToken);
        return series is not null && (series.CreatedBy == _currentUser.UserId || await CanManageStudioAsync(series.StudioId, cancellationToken));
    }

    public async Task<bool> CanAccessChapterAsync(Guid chapterId, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(chapterId, cancellationToken);
        return chapter is not null && await CanAccessSeriesAsync(chapter.SeriesId, cancellationToken);
    }

    public async Task<bool> CanManageChapterAsync(Guid chapterId, CancellationToken cancellationToken = default)
    {
        var chapter = await _repository.GetByIdAsync<Chapter>(chapterId, cancellationToken);
        return chapter is not null && await CanManageSeriesAsync(chapter.SeriesId, cancellationToken);
    }

    public async Task<bool> CanAccessPageAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        var page = await _repository.GetByIdAsync<Page>(pageId, cancellationToken);
        if (page is null) return false;
        if (await CanAccessChapterAsync(page.ChapterId, cancellationToken)) return true;

        return (await _repository.ListAsync<MangaTask>(
            task => task.PageId == pageId && task.AssignedToUserId == _currentUser.UserId,
            cancellationToken)).Count > 0;
    }

    public async Task<bool> CanManagePageAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        var page = await _repository.GetByIdAsync<Page>(pageId, cancellationToken);
        return page is not null && await CanManageChapterAsync(page.ChapterId, cancellationToken);
    }

    public async Task<bool> CanAccessAnnotationAsync(Guid annotationId, CancellationToken cancellationToken = default)
    {
        var annotation = await _repository.GetByIdAsync<Annotation>(annotationId, cancellationToken);
        return annotation is not null && await CanAccessPageAsync(annotation.PageId, cancellationToken);
    }

    public async Task<bool> CanManageAnnotationAsync(Guid annotationId, CancellationToken cancellationToken = default)
    {
        var annotation = await _repository.GetByIdAsync<Annotation>(annotationId, cancellationToken);
        return annotation is not null && await CanManagePageAsync(annotation.PageId, cancellationToken);
    }

    public async Task<bool> CanAccessTaskAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        if (IsAdministrator) return true;
        var task = await _repository.GetByIdAsync<MangaTask>(taskId, cancellationToken);
        return task is not null && (task.AssignedToUserId == _currentUser.UserId || task.CreatedByUserId == _currentUser.UserId || await CanManagePageAsync(task.PageId, cancellationToken));
    }

    public async Task<bool> CanWorkTaskAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        if (IsAdministrator) return true;
        var task = await _repository.GetByIdAsync<MangaTask>(taskId, cancellationToken);
        return task?.AssignedToUserId == _currentUser.UserId;
    }
}
