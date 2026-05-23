using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;

namespace Manga.Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("manga/series")]
public sealed class SeriesController : ApiControllerBase
{
    private readonly ISeriesService _seriesService;
    private readonly IChapterService _chapterService;

    public SeriesController(ISeriesService seriesService, IChapterService chapterService)
    {
        _seriesService = seriesService;
        _chapterService = chapterService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSeriesRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.CreateAsync(request, CurrentUserId, cancellationToken));

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.GetAllAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.GetByIdAsync(id, cancellationToken));

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSeriesRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.UpdateAsync(id, request, cancellationToken));

    [HttpPost("{seriesId:guid}/chapters")]
    public async Task<IActionResult> CreateChapter(Guid seriesId, CreateChapterRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _chapterService.CreateAsync(seriesId, request, cancellationToken));

    [HttpGet("{seriesId:guid}/chapters")]
    public async Task<IActionResult> GetChapters(Guid seriesId, CancellationToken cancellationToken) =>
        ToActionResult(await _chapterService.GetBySeriesAsync(seriesId, cancellationToken));
}
