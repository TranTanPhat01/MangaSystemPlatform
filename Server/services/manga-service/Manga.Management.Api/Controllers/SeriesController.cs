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

    [Authorize(Roles = "Mangaka,Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(CreateSeriesRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.CreateAsync(request, CurrentUserId, cancellationToken));

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.GetAllAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.GetByIdAsync(id, cancellationToken));

    [Authorize(Roles = "Mangaka,Admin")]
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSeriesRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.UpdateAsync(id, request, cancellationToken));

    [Authorize(Roles = "Mangaka,Admin")]
    [HttpPost("{id:guid}/submit-proposal")]
    public async Task<IActionResult> SubmitProposal(Guid id, [FromQuery] Guid? boardUserId, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.SubmitProposalAsync(id, CurrentUserId, boardUserId, cancellationToken));

    [Authorize(Roles = "EditorialBoard,Admin")]
    [HttpPost("{id:guid}/approve-proposal")]
    public async Task<IActionResult> ApproveProposal(Guid id, SeriesDecisionRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.ApproveProposalAsync(id, request, CurrentUserId, cancellationToken));

    [Authorize(Roles = "EditorialBoard,Admin")]
    [HttpPost("{id:guid}/reject-proposal")]
    public async Task<IActionResult> RejectProposal(Guid id, SeriesDecisionRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _seriesService.RejectProposalAsync(id, request, CurrentUserId, cancellationToken));

    [Authorize(Roles = "Mangaka,Admin")]
    [HttpPost("{seriesId:guid}/chapters")]
    public async Task<IActionResult> CreateChapter(Guid seriesId, CreateChapterRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _chapterService.CreateAsync(seriesId, request, cancellationToken));

    [HttpGet("{seriesId:guid}/chapters")]
    public async Task<IActionResult> GetChapters(Guid seriesId, CancellationToken cancellationToken) =>
        ToActionResult(await _chapterService.GetBySeriesAsync(seriesId, cancellationToken));
}
