using Manga.Notification.Api.Hubs;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Application.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace Manga.Notification.Api.Services;

public sealed class SignalRNotificationRealtimePublisher : INotificationRealtimePublisher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationRealtimePublisher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PublishAsync(NotificationResponse notification, CancellationToken cancellationToken = default) =>
        _hubContext
            .Clients
            .User(notification.UserId.ToString())
            .SendAsync("NotificationReceived", notification, cancellationToken);
}
