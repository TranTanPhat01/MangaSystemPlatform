using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;

namespace Manga.Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("manga/studios")]
public sealed class StudiosController : ApiControllerBase
{
    private readonly IStudioService _studioService;

    public StudiosController(IStudioService studioService)
    {
        _studioService = studioService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStudioRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _studioService.CreateAsync(request, CurrentUserId, cancellationToken));

    [HttpGet("my")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken) =>
        ToActionResult(await _studioService.GetMineAsync(CurrentUserId, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await _studioService.GetByIdAsync(id, cancellationToken));

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, AddStudioMemberRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _studioService.AddMemberAsync(id, request, cancellationToken));
}
