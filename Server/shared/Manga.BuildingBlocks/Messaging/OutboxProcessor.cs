using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Manga.BuildingBlocks.Messaging;

public sealed class OutboxProcessor : BackgroundService
{
    private static readonly TimeSpan IdlePollInterval = TimeSpan.FromSeconds(2);
    private readonly IServiceScopeFactory _scopeFactory; private readonly IRawEventPublisher _publisher; private readonly ILogger<OutboxProcessor> _logger; private readonly int _maxRetry;
    public OutboxProcessor(IServiceScopeFactory scopeFactory, IRawEventPublisher publisher, IOptions<OutboxOptions> options, ILogger<OutboxProcessor> logger) { _scopeFactory = scopeFactory; _publisher = publisher; _logger = logger; _maxRetry = options.Value.MaxRetry; }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var consecutiveFailures = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = IdlePollInterval;
            try
            {
                await ProcessAsync(stoppingToken);
                consecutiveFailures = 0;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                consecutiveFailures++;
                delay = GetRetryDelay(consecutiveFailures);
                _logger.LogWarning(
                    exception,
                    "Outbox polling failed. Attempt {Attempt}; retrying in {RetryDelaySeconds}s.",
                    consecutiveFailures,
                    delay.TotalSeconds);
            }

            await Task.Delay(delay, stoppingToken);
        }
    }
    public async Task ProcessAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope(); var store = scope.ServiceProvider.GetRequiredService<IOutboxStore>(); var now = DateTime.UtcNow;
        foreach (var message in await store.GetDueAsync(50, now, cancellationToken))
        {
            try
            {
                var eventType = Type.GetType(message.EventType, throwOnError: true)!;
                var eventMessage = JsonSerializer.Deserialize(message.Payload, eventType) ?? throw new InvalidOperationException("Outbox payload cannot be deserialized.");
                await PublishUntypedAsync(eventType, eventMessage, cancellationToken);
                message.Status = OutboxMessageStatus.Published; message.ProcessedAt = DateTime.UtcNow; message.LastError = null; message.NextRetryAt = null;
            }
            catch (Exception exception)
            {
                message.RetryCount++; message.LastError = exception.Message;
                message.Status = message.RetryCount >= _maxRetry ? OutboxMessageStatus.Failed : OutboxMessageStatus.Pending;
                var retryDelay = GetRetryDelay(message.RetryCount);
                message.NextRetryAt = message.Status == OutboxMessageStatus.Failed ? null : DateTime.UtcNow.Add(retryDelay);
                _logger.LogWarning(exception, "Outbox message {MessageId} ({EventType}) failed, retry {RetryCount}; next retry in {RetryDelaySeconds}s.", message.MessageId, message.RoutingKey, message.RetryCount, retryDelay.TotalSeconds);
            }
        }
        await store.SaveChangesAsync(cancellationToken);
    }
    private static TimeSpan GetRetryDelay(int attempt) => attempt switch
    {
        <= 1 => TimeSpan.FromSeconds(5),
        2 => TimeSpan.FromSeconds(10),
        3 => TimeSpan.FromSeconds(30),
        _ => TimeSpan.FromSeconds(60)
    };
    private Task PublishUntypedAsync(Type type, object message, CancellationToken cancellationToken) => (Task)typeof(OutboxProcessor).GetMethod(nameof(PublishGenericAsync), System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!.MakeGenericMethod(type).Invoke(this, new[] { message, cancellationToken })!;
    private Task PublishGenericAsync<T>(object message, CancellationToken cancellationToken) => _publisher.PublishOrThrowAsync((T)message, cancellationToken);
}

public sealed class OutboxOptions { public int MaxRetry { get; set; } = 5; }
