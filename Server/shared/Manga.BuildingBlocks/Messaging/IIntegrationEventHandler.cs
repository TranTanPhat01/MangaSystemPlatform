namespace Manga.BuildingBlocks.Messaging;

public interface IIntegrationEventHandler<in TEvent>
{
    Task HandleAsync(TEvent eventMessage, CancellationToken cancellationToken = default);
}
