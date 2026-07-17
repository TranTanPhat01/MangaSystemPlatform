using System.Text.Json;

namespace Manga.BuildingBlocks.Messaging;

public sealed class OutboxEventBus : IEventBus
{
    private readonly IOutboxStore _store;
    public OutboxEventBus(IOutboxStore store) => _store = store;

    public Task PublishAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var value = typeof(TEvent).GetProperty("MessageId")?.GetValue(eventMessage);
        var messageId = value is Guid id ? id : Guid.NewGuid();
        return _store.AddAsync(new OutboxMessage { MessageId = messageId, EventType = typeof(TEvent).AssemblyQualifiedName ?? typeof(TEvent).FullName ?? typeof(TEvent).Name, RoutingKey = typeof(TEvent).Name, Payload = JsonSerializer.Serialize(eventMessage) }, cancellationToken);
    }
}
