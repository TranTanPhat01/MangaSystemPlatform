using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;

namespace Manga.Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("manga/chapters")]
public sealed class ChaptersController : ApiControllerBase
{
    private readonly IChapterService _chapterService;
    private readonly IPageService _pageService;

    public ChaptersController(IChapterService chapterService, IPageService pageService)
    {
        _chapterService = chapterService;
        _pageService = pageService;
    }

    [HttpGet("{chapterId:guid}")]
    public async Task<IActionResult> GetById(Guid chapterId, CancellationToken cancellationToken) =>
        ToActionResult(await _chapterService.GetByIdAsync(chapterId, cancellationToken));

    [HttpPatch("{chapterId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid chapterId, UpdateChapterStatusRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _chapterService.UpdateStatusAsync(chapterId, request, CurrentUserId, cancellationToken));

    [HttpPost("{chapterId:guid}/pages")]
    public async Task<IActionResult> CreatePage(Guid chapterId, CreatePageRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _pageService.CreateAsync(chapterId, request, cancellationToken));

    [HttpGet("{chapterId:guid}/pages")]
    public async Task<IActionResult> GetPages(Guid chapterId, CancellationToken cancellationToken) =>
        ToActionResult(await _pageService.GetByChapterAsync(chapterId, cancellationToken));
}
