using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Application.Services;

namespace Manga.Editorial.Api.Controllers;

[Authorize]
[ApiController]
[Route("editorial/publication-schedules")]
public sealed class PublicationSchedulesController : ApiControllerBase
{
    private readonly IPublicationService _service;
    public PublicationSchedulesController(IPublicationService service) { _service = service; }
    [HttpPost] public async Task<IActionResult> Create(CreatePublicationScheduleRequest request, CancellationToken ct) => ToActionResult(await _service.CreateScheduleAsync(request, ct));
    [HttpGet] public async Task<IActionResult> GetAll(CancellationToken ct) => ToActionResult(await _service.GetSchedulesAsync(ct));
    [HttpGet("{scheduleId:guid}")] public async Task<IActionResult> Get(Guid scheduleId, CancellationToken ct) => ToActionResult(await _service.GetScheduleAsync(scheduleId, ct));
    [HttpPost("{scheduleId:guid}/publish")] public async Task<IActionResult> Publish(Guid scheduleId, CancellationToken ct) => ToActionResult(await _service.PublishAsync(scheduleId, ct));
}
