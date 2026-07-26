using Manga.BuildingBlocks.Responses;
using Manga.Notification.Application.DTOs;
using Manga.Notification.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Manga.Notification.Api.Controllers;

[Authorize]
[ApiController]
[Route("notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMine([FromQuery] bool? isRead, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) =>
        Ok(ApiResponse<IReadOnlyList<NotificationResponse>>.Ok(await _notificationService.GetMineAsync(isRead, page, pageSize, cancellationToken)));

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken) =>
        Ok(ApiResponse<UnreadCountResponse>.Ok(await _notificationService.GetUnreadCountAsync(cancellationToken)));

    [HttpPatch("{notificationId:guid}/read")]
    [HttpPost("{notificationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<NotificationResponse>.Ok(await _notificationService.MarkAsReadAsync(notificationId, cancellationToken)));

    [HttpPatch("{notificationId:guid}/unread")]
    [HttpPost("{notificationId:guid}/unread")]
    public async Task<IActionResult> MarkAsUnread(Guid notificationId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<NotificationResponse>.Ok(await _notificationService.MarkAsUnreadAsync(notificationId, cancellationToken)));

    [HttpPatch("read-all")]
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken) =>
        Ok(ApiResponse<UnreadCountResponse>.Ok(await _notificationService.MarkAllAsReadAsync(cancellationToken)));

    [HttpDelete("{notificationId:guid}")]
    public async Task<IActionResult> Delete(Guid notificationId, CancellationToken cancellationToken)
    {
        await _notificationService.DeleteAsync(notificationId, cancellationToken);
        return Ok(ApiResponse<object>.Ok("Notification deleted successfully"));
    }
}
