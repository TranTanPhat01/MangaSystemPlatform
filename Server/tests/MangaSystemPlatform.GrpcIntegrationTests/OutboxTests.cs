using FluentAssertions;
using Manga.BuildingBlocks.Messaging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class OutboxTests
{
    [Fact]
    public async Task EventBus_StoresPendingOutboxMessage()
    {
        var store = new Store(); var bus = new OutboxEventBus(store); var id = Guid.NewGuid();
        await bus.PublishAsync(new SampleEvent(id));
        store.Messages.Should().ContainSingle(message => message.MessageId == id && message.Status == OutboxMessageStatus.Pending);
    }

    [Fact]
    public async Task Processor_MarksPublishedAfterSuccessfulPublish()
    {
        var store = new Store(); await store.AddAsync(Message());
        var publisher = new Publisher(); await CreateProcessor(store, publisher).ProcessAsync(CancellationToken.None);
        store.Messages.Single().Status.Should().Be(OutboxMessageStatus.Published);
        publisher.Count.Should().Be(1);
    }

    [Fact]
    public async Task Processor_RetriesThenMarksFailedAtMaxRetry()
    {
        var store = new Store(); await store.AddAsync(Message());
        var publisher = new Publisher { Throw = true }; var processor = CreateProcessor(store, publisher, maxRetry: 2);
        await processor.ProcessAsync(CancellationToken.None);
        store.Messages.Single().Status.Should().Be(OutboxMessageStatus.Pending);
        store.Messages.Single().RetryCount.Should().Be(1);
        store.Messages.Single().LastError.Should().NotBeNullOrWhiteSpace();
        store.Messages.Single().NextRetryAt = DateTime.UtcNow.AddSeconds(-1);
        await processor.ProcessAsync(CancellationToken.None);
        store.Messages.Single().Status.Should().Be(OutboxMessageStatus.Failed);
        store.Messages.Single().RetryCount.Should().Be(2);
    }

    [Fact]
    public async Task Processor_UsesBackoffWhenPublishFails()
    {
        var store = new Store(); await store.AddAsync(Message());
        var before = DateTime.UtcNow;

        await CreateProcessor(store, new Publisher { Throw = true }).ProcessAsync(CancellationToken.None);

        store.Messages.Single().NextRetryAt.Should().BeOnOrAfter(before.AddSeconds(5));
    }

    private static OutboxProcessor CreateProcessor(Store store, Publisher publisher, int maxRetry = 5)
    {
        var services = new ServiceCollection(); services.AddSingleton<IOutboxStore>(store); var provider = services.BuildServiceProvider();
        return new OutboxProcessor(provider.GetRequiredService<IServiceScopeFactory>(), publisher, Options.Create(new OutboxOptions { MaxRetry = maxRetry }), NullLogger<OutboxProcessor>.Instance);
    }
    private static OutboxMessage Message() { var id = Guid.NewGuid(); return new OutboxMessage { MessageId = id, EventType = typeof(SampleEvent).AssemblyQualifiedName!, RoutingKey = nameof(SampleEvent), Payload = System.Text.Json.JsonSerializer.Serialize(new SampleEvent(id)) }; }
    private sealed record SampleEvent(Guid MessageId);
    private sealed class Store : IOutboxStore
    {
        public List<OutboxMessage> Messages { get; } = new();
        public Task AddAsync(OutboxMessage message, CancellationToken cancellationToken = default) { Messages.Add(message); return Task.CompletedTask; }
        public Task<IReadOnlyList<OutboxMessage>> GetDueAsync(int take, DateTime now, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<OutboxMessage>>(Messages.Where(message => message.Status == OutboxMessageStatus.Pending && (!message.NextRetryAt.HasValue || message.NextRetryAt <= now)).Take(take).ToArray());
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
    private sealed class Publisher : IRawEventPublisher
    {
        public bool Throw { get; set; } public int Count { get; private set; }
        public Task PublishAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default) { Count++; if (Throw) throw new InvalidOperationException("RabbitMQ unavailable"); return Task.CompletedTask; }
        public Task PublishOrThrowAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default) => PublishAsync(eventMessage, cancellationToken);
    }
}
