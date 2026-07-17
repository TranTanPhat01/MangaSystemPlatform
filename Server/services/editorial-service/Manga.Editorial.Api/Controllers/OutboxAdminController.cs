using Manga.BuildingBlocks.Messaging;
using Manga.BuildingBlocks.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Manga.Editorial.Api.Controllers;

[ApiController]
[Route("admin/outbox")]
public sealed class OutboxAdminController(IOutboxOperations operations) : ControllerBase
{
    [Authorize(Policy = PermissionPolicies.RequireAdminOutboxRead)]
    [HttpGet("summary")] public async Task<IActionResult> Summary(CancellationToken ct) => Ok(await operations.GetSummaryAsync(ct));
    [Authorize(Policy = PermissionPolicies.RequireAdminOutboxRead)]
    [HttpGet] public async Task<IActionResult> List(OutboxMessageStatus? status, int page = 1, int pageSize = 20, CancellationToken ct = default) => Ok((await operations.ListAsync(status, Math.Max(1, page), Math.Clamp(pageSize, 1, 100), ct)).Select(ToResponse));
    [Authorize(Policy = PermissionPolicies.RequireAdminOutboxRead)]
    [HttpGet("{id:guid}")] public async Task<IActionResult> Get(Guid id, CancellationToken ct) { var message = await operations.GetByIdAsync(id, ct); return message is null ? NotFound() : Ok(ToResponse(message)); }
    [Authorize(Policy = PermissionPolicies.RequireAdminOutboxRetry)]
    [HttpPost("{id:guid}/retry")] public async Task<IActionResult> Retry(Guid id, CancellationToken ct) => await operations.RetryAsync(id, ct) ? NoContent() : NotFound();
    [Authorize(Policy = PermissionPolicies.RequireAdminOutboxRetry)]
    [HttpPost("retry-failed")] public async Task<IActionResult> RetryFailed(CancellationToken ct) => Ok(new { Retried = await operations.RetryFailedAsync(ct) });
    private static OutboxResponse ToResponse(OutboxMessage message) => new(message.Id, message.MessageId, message.EventType, message.RoutingKey, message.Status, message.RetryCount, message.LastError, message.CreatedAt, message.ProcessedAt, message.NextRetryAt);
    private sealed record OutboxResponse(Guid Id, Guid MessageId, string EventType, string RoutingKey, OutboxMessageStatus Status, int RetryCount, string? LastError, DateTime CreatedAt, DateTime? ProcessedAt, DateTime? NextRetryAt);
}
