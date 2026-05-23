namespace Manga.BuildingBlocks.Messaging;

public interface IEventBus
{
    Task PublishAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default);
}
