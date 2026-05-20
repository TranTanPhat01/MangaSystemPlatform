using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Application.Services;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Api.Controllers;

[Authorize]
[ApiController]
[Route("editorial/series/{seriesId:guid}")]
public sealed class BoardVotesController : ApiControllerBase
{
    private readonly IBoardVoteService _service;
    private readonly IPublicationService _publicationService;
    private readonly IRankingService _rankingService;
    public BoardVotesController(IBoardVoteService service, IPublicationService publicationService, IRankingService rankingService) { _service = service; _publicationService = publicationService; _rankingService = rankingService; }
    [HttpPost("votes")] public async Task<IActionResult> Vote(Guid seriesId, BoardVoteRequest request, CancellationToken ct) => ToActionResult(await _service.VoteAsync(seriesId, request, ct));
    [HttpGet("votes")] public async Task<IActionResult> GetVotes(Guid seriesId, CancellationToken ct) => ToActionResult(await _service.GetVotesAsync(seriesId, ct));
    [HttpGet("vote-summary")] public async Task<IActionResult> Summary(Guid seriesId, CancellationToken ct) => ToActionResult(await _service.GetSummaryAsync(seriesId, ct));
    [HttpPost("hiatus")] public async Task<IActionResult> Hiatus(Guid seriesId, CancellationToken ct) => ToActionResult(await _publicationService.SetSeriesPublicationStatusAsync(seriesId, PublicationStatus.Hiatus, ct));
    [HttpPost("cancel")] public async Task<IActionResult> Cancel(Guid seriesId, CancellationToken ct) => ToActionResult(await _publicationService.SetSeriesPublicationStatusAsync(seriesId, PublicationStatus.Cancelled, ct));
    [HttpGet("ranking-history")] public async Task<IActionResult> RankingHistory(Guid seriesId, CancellationToken ct) => ToActionResult(await _rankingService.GetSeriesRankingHistoryAsync(seriesId, ct));
    [HttpGet("cancellation-warnings")] public async Task<IActionResult> Warnings(Guid seriesId, CancellationToken ct) => ToActionResult(await _rankingService.GetCancellationWarningsAsync(seriesId, ct));
}
