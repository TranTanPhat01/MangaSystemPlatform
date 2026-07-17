using FluentAssertions;
using Manga.BuildingBlocks.Messaging;
using Manga.BuildingBlocks.Authorization;
using Manga.Management.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class OutboxOperationsTests
{
    [Fact]
    public void OutboxEndpoints_UsePermissionPolicies()
    {
        var controller = typeof(OutboxAdminController);
        AttributesOf(controller, nameof(OutboxAdminController.List)).Should().ContainSingle(attribute => attribute.Policy == PermissionPolicies.RequireAdminOutboxRead);
        AttributesOf(controller, nameof(OutboxAdminController.Get)).Should().ContainSingle(attribute => attribute.Policy == PermissionPolicies.RequireAdminOutboxRead);
        AttributesOf(controller, nameof(OutboxAdminController.Retry)).Should().ContainSingle(attribute => attribute.Policy == PermissionPolicies.RequireAdminOutboxRetry);
        AttributesOf(controller, nameof(OutboxAdminController.RetryFailed)).Should().ContainSingle(attribute => attribute.Policy == PermissionPolicies.RequireAdminOutboxRetry);
    }

    [Fact]
    public async Task AdminCanListAndRetryFailedMessages()
    {
        var failed = Failed(); var operations = new Operations(failed, Failed());
        var controller = new OutboxAdminController(operations);

        var list = await controller.List(OutboxMessageStatus.Failed);
        list.Should().BeOfType<OkObjectResult>();
        (await controller.Retry(failed.Id, CancellationToken.None)).Should().BeOfType<NoContentResult>();
        failed.Status.Should().Be(OutboxMessageStatus.Pending);
        failed.LastError.Should().BeNull();
        failed.NextRetryAt.Should().BeOnOrBefore(DateTime.UtcNow);

        var all = await controller.RetryFailed(CancellationToken.None);
        all.Should().BeOfType<OkObjectResult>();
        operations.Messages.Should().OnlyContain(message => message.Status == OutboxMessageStatus.Pending);
    }

    private static OutboxMessage Failed() => new() { MessageId = Guid.NewGuid(), Status = OutboxMessageStatus.Failed, LastError = "Rabbit unavailable", RetryCount = 5 };
    private static IEnumerable<AuthorizeAttribute> AttributesOf(Type controller, string methodName) => controller.GetMethod(methodName)!.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>();
    private sealed class Operations(params OutboxMessage[] messages) : IOutboxOperations
    {
        public List<OutboxMessage> Messages { get; } = messages.ToList();
        public Task<IReadOnlyList<OutboxMessage>> ListAsync(OutboxMessageStatus? status, int page, int pageSize, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<OutboxMessage>>(Messages.Where(message => !status.HasValue || message.Status == status).ToArray());
        public Task<OutboxMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<OutboxMessage?>(Messages.FirstOrDefault(message => message.Id == id));
        public async Task<bool> RetryAsync(Guid id, CancellationToken cancellationToken = default) { var message = await GetByIdAsync(id, cancellationToken); if (message is null || message.Status != OutboxMessageStatus.Failed) return false; Reset(message); return true; }
        public Task<int> RetryFailedAsync(CancellationToken cancellationToken = default) { var failed = Messages.Where(message => message.Status == OutboxMessageStatus.Failed).ToArray(); foreach (var message in failed) Reset(message); return Task.FromResult(failed.Length); }
        public Task<OutboxSummary> GetSummaryAsync(CancellationToken cancellationToken = default) => Task.FromResult(new OutboxSummary(Messages.Count(message => message.Status == OutboxMessageStatus.Pending), Messages.Count(message => message.Status == OutboxMessageStatus.Failed), Messages.Count(message => message.Status == OutboxMessageStatus.Published && message.ProcessedAt >= DateTime.UtcNow.AddHours(-24)), Messages.Where(message => message.Status == OutboxMessageStatus.Failed).Select(message => (DateTime?)message.CreatedAt).Max()));
        private static void Reset(OutboxMessage message) { message.Status = OutboxMessageStatus.Pending; message.LastError = null; message.NextRetryAt = DateTime.UtcNow; }
    }
}
