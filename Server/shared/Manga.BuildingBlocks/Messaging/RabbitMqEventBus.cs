using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Manga.BuildingBlocks.Middleware;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Manga.BuildingBlocks.Messaging;

public sealed class RabbitMqEventBus : IEventBus, IDisposable
{
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqEventBus> _logger;
    private readonly IConnectionFactory _connectionFactory;
    private readonly object _connectionLock = new();
    private IConnection? _connection;
    private bool _disposed;

    public RabbitMqEventBus(IOptions<RabbitMqOptions> options, ILogger<RabbitMqEventBus> logger)
        : this(options, logger, null)
    {
    }

    public RabbitMqEventBus(
        IOptions<RabbitMqOptions> options,
        ILogger<RabbitMqEventBus> logger,
        IConnectionFactory? connectionFactory)
    {
        _options = options.Value;
        _logger = logger;
        _connectionFactory = connectionFactory ?? new ConnectionFactory
        {
            HostName = _options.HostName,
            Port = _options.Port,
            UserName = _options.UserName,
            Password = _options.Password,
            AutomaticRecoveryEnabled = true
        };
    }

    private IConnection GetConnection()
    {
        if (_connection != null && _connection.IsOpen)
        {
            return _connection;
        }

        lock (_connectionLock)
        {
            if (_connection != null && _connection.IsOpen)
            {
                return _connection;
            }

            if (_connection != null)
            {
                try
                {
                    _connection.Dispose();
                }
                catch
                {
                    // Ignore
                }
            }

            _logger.LogInformation("Creating new RabbitMQ connection to {Host}:{Port}", _options.HostName, _options.Port);
            _connection = _connectionFactory.CreateConnection();

            _connection.ConnectionShutdown += OnConnectionShutdown;
            if (_connection is IAutorecoveringConnection recoveringConnection)
            {
                recoveringConnection.RecoverySucceeded += OnConnectionRecoverySucceeded;
                recoveringConnection.ConnectionRecoveryError += OnConnectionRecoveryError;
            }

            return _connection;
        }
    }

    private void OnConnectionShutdown(object? sender, ShutdownEventArgs e)
    {
        _logger.LogWarning("RabbitMQ connection lost. Reason: {Reason}", e.ReplyText);
    }

    private void OnConnectionRecoverySucceeded(object? sender, EventArgs e)
    {
        _logger.LogInformation("RabbitMQ connection successfully recovered.");
    }

    private void OnConnectionRecoveryError(object? sender, ConnectionRecoveryErrorEventArgs e)
    {
        _logger.LogError(e.Exception, "Error during RabbitMQ connection recovery.");
    }

    public Task PublishAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default)
    {
        var eventName = typeof(TEvent).Name;
        var correlationId = CorrelationIdContext.Current;

        try
        {
            var connection = GetConnection();
            using var channel = connection.CreateModel();
            channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);

            var messageId = ReadMessageId(eventMessage);
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(eventMessage));
            
            var properties = channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";
            properties.Type = eventName;
            properties.MessageId = messageId;
            properties.CorrelationId = correlationId;

            channel.BasicPublish(_options.ExchangeName, eventName, properties, body);
            _logger.LogInformation(
                "Published event {EventType} with MessageId {MessageId} to exchange {Exchange} using routing key {RoutingKey}. CorrelationId={CorrelationId}",
                eventName,
                messageId,
                _options.ExchangeName,
                eventName,
                correlationId);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception, 
                "Failed to publish event {EventType}. CorrelationId={CorrelationId}", 
                eventName,
                correlationId);
        }

        return Task.CompletedTask;
    }

    private static string ReadMessageId<TEvent>(TEvent eventMessage)
    {
        var property = typeof(TEvent).GetProperty("MessageId");
        var value = property?.GetValue(eventMessage);
        return value?.ToString() ?? Guid.NewGuid().ToString();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        lock (_connectionLock)
        {
            if (_connection != null)
            {
                try
                {
                    _connection.ConnectionShutdown -= OnConnectionShutdown;
                    if (_connection is IAutorecoveringConnection recoveringConnection)
                    {
                        recoveringConnection.RecoverySucceeded -= OnConnectionRecoverySucceeded;
                        recoveringConnection.ConnectionRecoveryError -= OnConnectionRecoveryError;
                    }
                    _connection.Dispose();
                    _logger.LogInformation("RabbitMQ connection disposed successfully.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error disposing RabbitMQ connection.");
                }
            }
        }
    }
}
