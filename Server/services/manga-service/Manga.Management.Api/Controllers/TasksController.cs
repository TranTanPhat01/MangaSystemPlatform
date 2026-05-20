using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;

namespace Manga.Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("manga/tasks")]
public sealed class TasksController : ApiControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTaskRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _taskService.CreateAsync(request, CurrentUserId, cancellationToken));

    [HttpGet("my")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken) =>
        ToActionResult(await _taskService.GetMineAsync(CurrentUserId, cancellationToken));

    [HttpGet("{taskId:guid}")]
    public async Task<IActionResult> GetById(Guid taskId, CancellationToken cancellationToken) =>
        ToActionResult(await _taskService.GetByIdAsync(taskId, cancellationToken));

    [HttpPost("{taskId:guid}/start")]
    public async Task<IActionResult> Start(Guid taskId, CancellationToken cancellationToken) =>
        ToActionResult(await _taskService.StartAsync(taskId, cancellationToken));

    [HttpPost("{taskId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid taskId, SubmitTaskRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _taskService.SubmitAsync(taskId, request, CurrentUserId, cancellationToken));

    [HttpPost("{taskId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid taskId, CancellationToken cancellationToken) =>
        ToActionResult(await _taskService.ApproveAsync(taskId, cancellationToken));

    [HttpPost("{taskId:guid}/request-revision")]
    public async Task<IActionResult> RequestRevision(Guid taskId, RequestRevisionRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _taskService.RequestRevisionAsync(taskId, request, CurrentUserId, cancellationToken));
}
