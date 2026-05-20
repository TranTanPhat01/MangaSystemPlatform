using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;

namespace Manga.BuildingBlocks.Messaging;

public abstract class RabbitMqBackgroundConsumer : BackgroundService
{
    private readonly RabbitMqOptions _options;
    private readonly ILogger _logger;

    protected RabbitMqBackgroundConsumer(IOptions<RabbitMqOptions> options, ILogger logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    protected abstract string QueueName { get; }
    protected abstract IReadOnlyCollection<string> RoutingKeys { get; }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var factory = new ConnectionFactory { HostName = _options.HostName, Port = _options.Port, UserName = _options.UserName, Password = _options.Password };
            var connection = factory.CreateConnection();
            var channel = connection.CreateModel();
            channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
            channel.QueueDeclare(QueueName, durable: true, exclusive: false, autoDelete: false);
            foreach (var routingKey in RoutingKeys) channel.QueueBind(QueueName, _options.ExchangeName, routingKey);

            var consumer = new EventingBasicConsumer(channel);
            consumer.Received += (_, args) => _logger.LogInformation("Received integration event {RoutingKey}: {Payload}", args.RoutingKey, Encoding.UTF8.GetString(args.Body.ToArray()));
            channel.BasicConsume(QueueName, autoAck: true, consumer);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "RabbitMQ consumer skeleton could not start.");
        }

        return Task.CompletedTask;
    }
}
