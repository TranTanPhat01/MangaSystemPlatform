using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace Manga.BuildingBlocks.Messaging;

public sealed class RabbitMqEventBus : IEventBus
{
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqEventBus> _logger;

    public RabbitMqEventBus(IOptions<RabbitMqOptions> options, ILogger<RabbitMqEventBus> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public Task PublishAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default)
    {
        try
        {
            var factory = new ConnectionFactory
            {
                HostName = _options.HostName,
                Port = _options.Port,
                UserName = _options.UserName,
                Password = _options.Password
            };

            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();
            channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);

            var eventName = typeof(TEvent).Name;
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(eventMessage));
            var properties = channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";
            properties.Type = eventName;

            channel.BasicPublish(_options.ExchangeName, eventName, properties, body);
            _logger.LogInformation("Published integration event {EventName}", eventName);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Failed to publish integration event {EventName}", typeof(TEvent).Name);
        }

        return Task.CompletedTask;
    }
}
