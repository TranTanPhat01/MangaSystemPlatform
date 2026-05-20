using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Application.Services;

namespace Manga.Editorial.Api.Controllers;

[Authorize]
[ApiController]
[Route("editorial/reviews")]
public sealed class EditorialReviewsController : ApiControllerBase
{
    private readonly IEditorialReviewService _service;
    public EditorialReviewsController(IEditorialReviewService service) { _service = service; }
    [HttpPost] public async Task<IActionResult> Create(CreateEditorialReviewRequest request, CancellationToken ct) => ToActionResult(await _service.CreateAsync(request, ct));
    [HttpGet] public async Task<IActionResult> GetAll(CancellationToken ct) => ToActionResult(await _service.GetAllAsync(ct));
    [HttpGet("{reviewId:guid}")] public async Task<IActionResult> Get(Guid reviewId, CancellationToken ct) => ToActionResult(await _service.GetByIdAsync(reviewId, ct));
    [HttpPost("{reviewId:guid}/comments")] public async Task<IActionResult> AddComment(Guid reviewId, CreateEditorialCommentRequest request, CancellationToken ct) => ToActionResult(await _service.AddCommentAsync(reviewId, request, ct));
    [HttpGet("{reviewId:guid}/comments")] public async Task<IActionResult> GetComments(Guid reviewId, CancellationToken ct) => ToActionResult(await _service.GetCommentsAsync(reviewId, ct));
    [HttpPost("{reviewId:guid}/approve")] public async Task<IActionResult> Approve(Guid reviewId, DecisionRequest request, CancellationToken ct) => ToActionResult(await _service.ApproveAsync(reviewId, request, ct));
    [HttpPost("{reviewId:guid}/request-revision")] public async Task<IActionResult> RequestRevision(Guid reviewId, DecisionRequest request, CancellationToken ct) => ToActionResult(await _service.RequestRevisionAsync(reviewId, request, ct));
    [HttpPost("{reviewId:guid}/reject")] public async Task<IActionResult> Reject(Guid reviewId, DecisionRequest request, CancellationToken ct) => ToActionResult(await _service.RejectAsync(reviewId, request, ct));
}
