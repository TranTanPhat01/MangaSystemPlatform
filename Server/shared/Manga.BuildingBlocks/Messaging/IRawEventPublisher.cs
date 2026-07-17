namespace Manga.BuildingBlocks.Messaging;
public interface IRawEventPublisher : IEventBus
{
    Task PublishOrThrowAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default);
}
