namespace Manga.BuildingBlocks.Messaging;

public interface IEventConsumer
{
    Task StartAsync(CancellationToken cancellationToken = default);
}
