using System.Text;
using System.Text.Json;
using Manga.BuildingBlocks.Middleware;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Serilog.Context;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Manga.BuildingBlocks.Messaging;

public sealed class RabbitMqEventConsumer<TEvent, THandler> : BackgroundService, IEventConsumer
    where TEvent : class
    where THandler : class, IIntegrationEventHandler<TEvent>
{
    private const int MaxRetryAttempts = 3;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly string _serviceName;
    private readonly RabbitMqOptions _options;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RabbitMqEventConsumer<TEvent, THandler>> _logger;

    private IConnection? _connection;
    private IModel? _channel;

    public RabbitMqEventConsumer(
        string serviceName,
        IOptions<RabbitMqOptions> options,
        IServiceScopeFactory scopeFactory,
        ILogger<RabbitMqEventConsumer<TEvent, THandler>> logger)
    {
        _serviceName = serviceName;
        _options = options.Value;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var eventName = typeof(TEvent).Name;
            var queueName = $"{_serviceName}.{eventName}";

            var factory = new ConnectionFactory
            {
                HostName = _options.HostName,
                Port = _options.Port,
                UserName = _options.UserName,
                Password = _options.Password,
                DispatchConsumersAsync = true
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
            _channel.QueueDeclare(queueName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(queueName, _options.ExchangeName, eventName);
            _channel.BasicQos(0, 1, false);

            var consumer = new AsyncEventingBasicConsumer(_channel);
            consumer.Received += async (_, args) => await HandleMessageAsync(eventName, args, stoppingToken);

            _channel.BasicConsume(queueName, autoAck: false, consumer);
            _logger.LogInformation("RabbitMQ consumer started for {QueueName}", queueName);
            await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("RabbitMQ consumer for {EventName} is stopping.", typeof(TEvent).Name);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "RabbitMQ consumer for {EventName} could not start.", typeof(TEvent).Name);
        }
    }

    private async Task HandleMessageAsync(string eventName, BasicDeliverEventArgs args, CancellationToken cancellationToken)
    {
        var payload = Encoding.UTF8.GetString(args.Body.ToArray());
        var messageId = args.BasicProperties?.MessageId ?? Guid.NewGuid().ToString();
        var correlationId = args.BasicProperties?.CorrelationId;

        using var eventTypeProperty = LogContext.PushProperty("EventType", eventName);
        using var messageIdProperty = LogContext.PushProperty("MessageId", messageId);
        using var correlationIdProperty = LogContext.PushProperty("CorrelationId", correlationId);

        _logger.LogInformation(
            "Received event {EventType} with MessageId {MessageId}",
            eventName,
            messageId);

        try
        {
            var eventMessage = JsonSerializer.Deserialize<TEvent>(payload, JsonOptions);
            if (eventMessage is null)
            {
                throw new InvalidOperationException($"Unable to deserialize integration event {eventName}.");
            }

            var previousCorrelationId = CorrelationIdContext.Current;
            CorrelationIdContext.Current = correlationId;
            try
            {
                await ExecuteWithRetryAsync(eventMessage, cancellationToken);
            }
            finally
            {
                CorrelationIdContext.Current = previousCorrelationId;
            }

            _channel?.BasicAck(args.DeliveryTag, multiple: false);
            _logger.LogInformation(
                "Processed event {EventType} with MessageId {MessageId} successfully",
                eventName,
                messageId);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to process event {EventType} with MessageId {MessageId}",
                eventName,
                messageId);
            _channel?.BasicNack(args.DeliveryTag, multiple: false, requeue: false);
        }
    }

    private async Task ExecuteWithRetryAsync(TEvent eventMessage, CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaxRetryAttempts; attempt++)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var handler = scope.ServiceProvider.GetRequiredService<THandler>();
                await handler.HandleAsync(eventMessage, cancellationToken);
                return;
            }
            catch when (attempt < MaxRetryAttempts)
            {
                _logger.LogWarning(
                    "Retrying event {EventType}. RetryCount={RetryCount}",
                    typeof(TEvent).Name,
                    attempt);
                await Task.Delay(TimeSpan.FromMilliseconds(200 * attempt), cancellationToken);
            }
        }

        using var finalScope = _scopeFactory.CreateScope();
        var finalHandler = finalScope.ServiceProvider.GetRequiredService<THandler>();
        await finalHandler.HandleAsync(eventMessage, cancellationToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
