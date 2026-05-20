using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Application.Services;

namespace Manga.Editorial.Api.Controllers;

[Authorize]
[ApiController]
[Route("editorial/issues")]
public sealed class IssuesController : ApiControllerBase
{
    private readonly IPublicationService _publicationService;
    private readonly IRankingService _rankingService;
    public IssuesController(IPublicationService publicationService, IRankingService rankingService) { _publicationService = publicationService; _rankingService = rankingService; }
    [HttpPost] public async Task<IActionResult> Create(CreateIssueRequest request, CancellationToken ct) => ToActionResult(await _publicationService.CreateIssueAsync(request, ct));
    [HttpGet] public async Task<IActionResult> GetAll(CancellationToken ct) => ToActionResult(await _publicationService.GetIssuesAsync(ct));
    [HttpGet("{issueId:guid}")] public async Task<IActionResult> Get(Guid issueId, CancellationToken ct) => ToActionResult(await _publicationService.GetIssueAsync(issueId, ct));
    [HttpPatch("{issueId:guid}/status")] public async Task<IActionResult> Status(Guid issueId, UpdateIssueStatusRequest request, CancellationToken ct) => ToActionResult(await _publicationService.UpdateIssueStatusAsync(issueId, request, ct));
    [HttpPost("{issueId:guid}/reader-votes")] public async Task<IActionResult> AddReaderVote(Guid issueId, ReaderVoteRequest request, CancellationToken ct) => ToActionResult(await _rankingService.AddReaderVoteAsync(issueId, request, ct));
    [HttpGet("{issueId:guid}/reader-votes")] public async Task<IActionResult> ReaderVotes(Guid issueId, CancellationToken ct) => ToActionResult(await _rankingService.GetReaderVotesAsync(issueId, ct));
    [HttpPost("{issueId:guid}/calculate-ranking")] public async Task<IActionResult> Calculate(Guid issueId, CancellationToken ct) => ToActionResult(await _rankingService.CalculateRankingAsync(issueId, ct));
    [HttpGet("{issueId:guid}/rankings")] public async Task<IActionResult> Rankings(Guid issueId, CancellationToken ct) => ToActionResult(await _rankingService.GetRankingsAsync(issueId, ct));
}
