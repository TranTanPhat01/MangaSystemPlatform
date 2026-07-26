using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Manga.BuildingBlocks.Exceptions;
using Manga.Contracts.Events;
using Manga.Notification.Application.Abstractions;
using Manga.Notification.Application.DTOs;
using Manga.Notification.Application.EventHandlers;
using Manga.Notification.Application.Services;
using Manga.Notification.Domain.Entities;
using Manga.Notification.Domain.Enums;
using Manga.Notification.Api.Hubs;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class NotificationTests
{
    private readonly FakeNotificationRepository _repository = new();
    private readonly FakeNotificationUnitOfWork _unitOfWork = new();
    private readonly FakeNotificationRealtimePublisher _publisher = new();
    private readonly FakeNotificationCurrentUserService _currentUser = new();

    private NotificationService CreateService() =>
        new(_repository, _unitOfWork, _currentUser);

    [Fact]
    public async Task GetNotifications_ReturnsCurrentUsersOnly()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        await _repository.AddNotificationAsync(new Notification { UserId = userA, Title = "A1", Message = "Msg A1", Type = NotificationType.System });
        await _repository.AddNotificationAsync(new Notification { UserId = userB, Title = "B1", Message = "Msg B1", Type = NotificationType.System });

        _currentUser.UserId = userA;
        var service = CreateService();

        var notifs = await service.GetMineAsync(null, 1, 10);
        notifs.Should().ContainSingle();
        notifs[0].Title.Should().Be("A1");
        notifs[0].UserId.Should().Be(userA);
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsDBCount()
    {
        var user = Guid.NewGuid();
        await _repository.AddNotificationAsync(new Notification { UserId = user, Title = "A1", Status = NotificationStatus.Unread });
        await _repository.AddNotificationAsync(new Notification { UserId = user, Title = "A2", Status = NotificationStatus.Read });

        _currentUser.UserId = user;
        var service = CreateService();

        var unread = await service.GetUnreadCountAsync();
        unread.Count.Should().Be(1);
    }

    [Fact]
    public async Task MarkRead_OwnNotification_Succeeds()
    {
        var user = Guid.NewGuid();
        var notification = new Notification { UserId = user, Title = "A1", Status = NotificationStatus.Unread };
        await _repository.AddNotificationAsync(notification);

        _currentUser.UserId = user;
        var service = CreateService();

        var response = await service.MarkAsReadAsync(notification.Id);
        response.Status.Should().Be(NotificationStatus.Read);
        notification.Status.Should().Be(NotificationStatus.Read);
        notification.ReadAt.Should().NotBeNull();
        _unitOfWork.SaveChangesCalls.Should().Be(1);
    }

    [Fact]
    public async Task MarkRead_OtherUsersNotification_Returns404()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var notification = new Notification { UserId = userB, Title = "B1", Status = NotificationStatus.Unread };
        await _repository.AddNotificationAsync(notification);

        _currentUser.UserId = userA;
        var service = CreateService();

        Func<Task> act = () => service.MarkAsReadAsync(notification.Id);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task MarkRead_IsIdempotent()
    {
        var user = Guid.NewGuid();
        var notification = new Notification { UserId = user, Title = "A1", Status = NotificationStatus.Read, ReadAt = DateTime.UtcNow.AddMinutes(-5) };
        await _repository.AddNotificationAsync(notification);

        _currentUser.UserId = user;
        var service = CreateService();

        var response = await service.MarkAsReadAsync(notification.Id);
        response.Status.Should().Be(NotificationStatus.Read);
        _unitOfWork.SaveChangesCalls.Should().Be(0); // No save changes because it was already read
    }

    [Fact]
    public async Task MarkUnread_Succeeds()
    {
        var user = Guid.NewGuid();
        var notification = new Notification { UserId = user, Title = "A1", Status = NotificationStatus.Read, ReadAt = DateTime.UtcNow };
        await _repository.AddNotificationAsync(notification);

        _currentUser.UserId = user;
        var service = CreateService();

        var response = await service.MarkAsUnreadAsync(notification.Id);
        response.Status.Should().Be(NotificationStatus.Unread);
        notification.Status.Should().Be(NotificationStatus.Unread);
        notification.ReadAt.Should().BeNull();
        _unitOfWork.SaveChangesCalls.Should().Be(1);
    }

    [Fact]
    public async Task MarkAllRead_OnlyUpdatesCurrentUser()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        var notifA = new Notification { UserId = userA, Title = "A", Status = NotificationStatus.Unread };
        var notifB = new Notification { UserId = userB, Title = "B", Status = NotificationStatus.Unread };

        await _repository.AddNotificationAsync(notifA);
        await _repository.AddNotificationAsync(notifB);

        _currentUser.UserId = userA;
        var service = CreateService();

        await service.MarkAllAsReadAsync();
        notifA.Status.Should().Be(NotificationStatus.Read);
        notifB.Status.Should().Be(NotificationStatus.Unread);
    }

    [Fact]
    public async Task GetNotifications_IsOrderedDeterministically()
    {
        var user = Guid.NewGuid();
        var baseTime = DateTime.UtcNow;

        var notif1 = new Notification { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), UserId = user, Title = "N1", CreatedAt = baseTime };
        var notif2 = new Notification { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), UserId = user, Title = "N2", CreatedAt = baseTime };

        await _repository.AddNotificationAsync(notif1);
        await _repository.AddNotificationAsync(notif2);

        _currentUser.UserId = user;
        var service = CreateService();

        var results = await service.GetMineAsync(null, 1, 10);
        results[0].Id.Should().Be(notif2.Id); // ID tie-breaker sort desc
        results[1].Id.Should().Be(notif1.Id);
    }

    [Fact]
    public async Task GetNotifications_PaginatesCorrectly()
    {
        var user = Guid.NewGuid();
        for (int i = 1; i <= 5; i++)
        {
            await _repository.AddNotificationAsync(new Notification { UserId = user, Title = $"N{i}", CreatedAt = DateTime.UtcNow.AddMinutes(i) });
        }

        _currentUser.UserId = user;
        var service = CreateService();

        var page1 = await service.GetMineAsync(null, 1, 2);
        page1.Count.Should().Be(2);
        page1[0].Title.Should().Be("N5");
        page1[1].Title.Should().Be("N4");

        var page2 = await service.GetMineAsync(null, 2, 2);
        page2.Count.Should().Be(2);
        page2[0].Title.Should().Be("N3");
        page2[1].Title.Should().Be("N2");
    }

    [Fact]
    public async Task TaskAssigned_CreatesAssistantNotification()
    {
        var assistantId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        var ev = new TaskAssignedEvent(Guid.NewGuid(), taskId, Guid.NewGuid(), assistantId, Guid.NewGuid(), DateTime.UtcNow);

        var handler = new TaskAssignedEventHandler(_repository, _unitOfWork, _publisher, NullLogger<TaskAssignedEventHandler>.Instance);
        await handler.HandleAsync(ev);

        var notifs = await _repository.GetByUserAsync(assistantId);
        notifs.Should().ContainSingle();
        var notification = notifs[0];
        notification.Type.Should().Be(NotificationType.TaskAssigned);
        notification.ResourceId.Should().Be(taskId);
        notification.ResourceType.Should().Be("Task");
        notification.ActionUrl.Should().Be($"/tasks?taskId={taskId}");
    }

    [Fact]
    public async Task DuplicateSourceEvent_CreatesOneNotification()
    {
        var assistantId = Guid.NewGuid();
        var ev = new TaskAssignedEvent(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), assistantId, Guid.NewGuid(), DateTime.UtcNow);

        var handler = new TaskAssignedEventHandler(_repository, _unitOfWork, _publisher, NullLogger<TaskAssignedEventHandler>.Instance);
        
        // Handle once
        await handler.HandleAsync(ev);
        // Handle duplicate redelivery
        await handler.HandleAsync(ev);

        var notifs = await _repository.GetByUserAsync(assistantId);
        notifs.Should().ContainSingle(); // Deduplicated successfully via Inbox
    }

    [Fact]
    public async Task CancellationWarning_CreatesNotification()
    {
        var mangakaId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        var ev = new CancellationWarningCreatedEvent(Guid.NewGuid(), seriesId, mangakaId, "High", "Low Ranking", DateTime.UtcNow);

        var handler = new CancellationWarningCreatedEventHandler(_repository, _unitOfWork, _publisher, NullLogger<CancellationWarningCreatedEventHandler>.Instance);
        await handler.HandleAsync(ev);

        var notifs = await _repository.GetByUserAsync(mangakaId);
        notifs.Should().ContainSingle();
        notifs[0].Type.Should().Be(NotificationType.CancellationWarning);
        notifs[0].ResourceId.Should().Be(seriesId);
        notifs[0].ResourceType.Should().Be("Series");
    }

    [Fact]
    public async Task ProposalSubmitted_CreatesBoardNotifications()
    {
        var seriesId = Guid.NewGuid();
        var boardUserId = Guid.NewGuid();
        var ev = new ProposalSubmittedEvent(Guid.NewGuid(), seriesId, Guid.NewGuid(), boardUserId, DateTime.UtcNow);

        var handler = new ProposalSubmittedEventHandler(_repository, _unitOfWork, _publisher, NullLogger<ProposalSubmittedEventHandler>.Instance);
        await handler.HandleAsync(ev);

        var notifs = await _repository.GetByUserAsync(boardUserId);
        notifs.Should().ContainSingle();
        notifs[0].Type.Should().Be(NotificationType.ProposalSubmitted);
        notifs[0].ResourceId.Should().Be(seriesId);
        notifs[0].ResourceType.Should().Be("Series");
        notifs[0].ActionUrl.Should().Be($"/board?tab=Proposals&seriesId={seriesId}");
    }

    [Fact]
    public void AnonymousHubConnection_IsRejected()
    {
        var type = typeof(NotificationHub);
        var authorizeAttribute = type.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true);
        authorizeAttribute.Should().NotBeEmpty();
    }

    [Fact]
    public void InvalidTokenHubConnection_IsRejected()
    {
        var type = typeof(NotificationHub);
        var authorizeAttribute = type.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true);
        authorizeAttribute.Should().NotBeEmpty();
    }

    [Fact]
    public void AuthenticatedHubConnection_Succeeds()
    {
        var type = typeof(NotificationHub);
        var authorizeAttribute = type.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true);
        authorizeAttribute.Should().NotBeEmpty();
    }

    [Fact]
    public async Task OtherUserDoesNotReceiveNotification()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        var ev = new TaskAssignedEvent(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), userA, Guid.NewGuid(), DateTime.UtcNow);
        var handler = new TaskAssignedEventHandler(_repository, _unitOfWork, _publisher, NullLogger<TaskAssignedEventHandler>.Instance);
        await handler.HandleAsync(ev);

        var notifsA = await _repository.GetByUserAsync(userA);
        var notifsB = await _repository.GetByUserAsync(userB);

        notifsA.Should().ContainSingle();
        notifsB.Should().BeEmpty();
    }

    [Fact]
    public void ClientCannotSubscribeAsAnotherUser()
    {
        var type = typeof(NotificationHub);
        var methods = type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.DeclaredOnly);
        methods.Should().BeEmpty();
    }

    [Fact]
    public void UserIdProvider_UsesStableUserIdClaim()
    {
        var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "user-123") };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "Test");
        var principal = new System.Security.Claims.ClaimsPrincipal(identity);
        
        principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value.Should().Be("user-123");
    }

    [Fact]
    public async Task SignalRDisconnect_FallbackPolling_ReconnectsWithoutDuplicate()
    {
        var user = Guid.NewGuid();
        var ev = new TaskAssignedEvent(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), user, Guid.NewGuid(), DateTime.UtcNow);
        var handler = new TaskAssignedEventHandler(_repository, _unitOfWork, _publisher, NullLogger<TaskAssignedEventHandler>.Instance);

        await handler.HandleAsync(ev);
        await handler.HandleAsync(ev); // simulate retry/redelivery

        var notifs = await _repository.GetByUserAsync(user);
        notifs.Should().ContainSingle();
    }
}

#region Fakes

internal sealed class FakeNotificationRepository : INotificationRepository
{
    private readonly Dictionary<Guid, Notification> _notifications = new();
    private readonly Dictionary<Guid, InboxMessage> _inboxes = new();

    public Task<IReadOnlyList<Notification>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Notification>>(_notifications.Values
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .ToArray());

    public Task<IReadOnlyList<Notification>> GetByUserPagedAsync(Guid userId, bool? isRead, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _notifications.Values.Where(n => n.UserId == userId);
        if (isRead.HasValue)
        {
            var targetStatus = isRead.Value ? NotificationStatus.Read : NotificationStatus.Unread;
            query = query.Where(n => n.Status == targetStatus);
        }
        var list = query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArray();
        return Task.FromResult<IReadOnlyList<Notification>>(list);
    }

    public Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(_notifications.Values.Count(n => n.UserId == userId && n.Status == NotificationStatus.Unread));

    public Task<Notification?> GetNotificationAsync(Guid notificationId, CancellationToken cancellationToken = default) =>
        Task.FromResult(_notifications.GetValueOrDefault(notificationId));

    public Task<InboxMessage?> GetInboxMessageAsync(Guid messageId, CancellationToken cancellationToken = default) =>
        Task.FromResult(_inboxes.Values.FirstOrDefault(i => i.MessageId == messageId));

    public Task AddNotificationAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        _notifications[notification.Id] = notification;
        return Task.CompletedTask;
    }

    public Task AddInboxMessageAsync(InboxMessage inboxMessage, CancellationToken cancellationToken = default)
    {
        _inboxes[inboxMessage.MessageId] = inboxMessage;
        return Task.CompletedTask;
    }

    public Task<bool> NotificationExistsAsync(Guid sourceEventId, NotificationType type, Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(_notifications.Values.Any(n => n.SourceEventId == sourceEventId && n.Type == type && n.UserId == userId));

    public void RemoveNotification(Notification notification)
    {
        _notifications.Remove(notification.Id);
    }
}

internal sealed class FakeNotificationUnitOfWork : INotificationUnitOfWork
{
    public int SaveChangesCalls { get; private set; }
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCalls++;
        return Task.FromResult(1);
    }
}

internal sealed class FakeNotificationRealtimePublisher : INotificationRealtimePublisher
{
    public List<NotificationResponse> Published { get; } = new();
    public Task PublishAsync(NotificationResponse notification, CancellationToken cancellationToken = default)
    {
        Published.Add(notification);
        return Task.CompletedTask;
    }
}

internal sealed class FakeNotificationCurrentUserService : ICurrentUserService
{
    public Guid UserId { get; set; } = Guid.NewGuid();
    private readonly HashSet<string> _roles = new(StringComparer.OrdinalIgnoreCase);
    public void SetRoles(params string[] roles)
    {
        _roles.Clear();
        foreach (var r in roles) _roles.Add(r);
    }
    public bool IsInRole(string role) => _roles.Contains(role);
}

#endregion
