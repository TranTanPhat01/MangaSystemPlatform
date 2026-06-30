using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Manga.BuildingBlocks.Messaging;
using Manga.BuildingBlocks.Middleware;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using RabbitMQ.Client;
using Xunit;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class RabbitMqEventBusTests
{
    private class SampleIntegrationEvent
    {
        public Guid MessageId { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = "Test Event";
    }

    [Fact]
    public async Task PublishAsync_MultiplePublishes_ReusesConnectionButCreatesNewChannel()
    {
        // Arrange
        var options = Options.Create(new RabbitMqOptions
        {
            HostName = "localhost",
            ExchangeName = "test-exchange"
        });

        var mockConnectionFactory = new Mock<IConnectionFactory>();
        var mockConnection = new Mock<IConnection>();
        var mockModel = new Mock<IModel>();

        mockConnection.Setup(c => c.IsOpen).Returns(true);
        mockConnection.Setup(c => c.CreateModel()).Returns(mockModel.Object);
        mockConnectionFactory.Setup(f => f.CreateConnection()).Returns(mockConnection.Object);

        var mockBasicProperties = new Mock<IBasicProperties>();
        mockModel.Setup(m => m.CreateBasicProperties()).Returns(mockBasicProperties.Object);

        using var eventBus = new RabbitMqEventBus(options, NullLogger<RabbitMqEventBus>.Instance, mockConnectionFactory.Object);

        // Act
        await eventBus.PublishAsync(new SampleIntegrationEvent());
        await eventBus.PublishAsync(new SampleIntegrationEvent());
        await eventBus.PublishAsync(new SampleIntegrationEvent());

        // Assert
        mockConnectionFactory.Verify(f => f.CreateConnection(), Times.Once);
        mockConnection.Verify(c => c.CreateModel(), Times.Exactly(3));
    }

    [Fact]
    public async Task PublishAsync_SerializesEventAndSetsPropertiesCorrectly()
    {
        // Arrange
        var options = Options.Create(new RabbitMqOptions
        {
            HostName = "localhost",
            ExchangeName = "test-exchange"
        });

        var mockConnectionFactory = new Mock<IConnectionFactory>();
        var mockConnection = new Mock<IConnection>();
        var mockModel = new Mock<IModel>();
        var mockBasicProperties = new Mock<IBasicProperties>();

        mockConnection.Setup(c => c.IsOpen).Returns(true);
        mockConnection.Setup(c => c.CreateModel()).Returns(mockModel.Object);
        mockConnectionFactory.Setup(f => f.CreateConnection()).Returns(mockConnection.Object);
        mockModel.Setup(m => m.CreateBasicProperties()).Returns(mockBasicProperties.Object);

        using var eventBus = new RabbitMqEventBus(options, NullLogger<RabbitMqEventBus>.Instance, mockConnectionFactory.Object);

        CorrelationIdContext.Current = "test-correlation-id-messaging";
        var testEvent = new SampleIntegrationEvent { Name = "Hello Event" };

        string? capturedExchange = null;
        string? capturedRoutingKey = null;
        IBasicProperties? capturedProperties = null;
        byte[]? capturedBody = null;

        mockModel.Setup(m => m.BasicPublish(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<bool>(),
            It.IsAny<IBasicProperties>(),
            It.IsAny<ReadOnlyMemory<byte>>()))
            .Callback<string, string, bool, IBasicProperties, ReadOnlyMemory<byte>>((exchange, routingKey, mandatory, properties, body) =>
            {
                capturedExchange = exchange;
                capturedRoutingKey = routingKey;
                capturedProperties = properties;
                capturedBody = body.ToArray();
            });

        // Act
        await eventBus.PublishAsync(testEvent);

        // Assert
        capturedExchange.Should().Be("test-exchange");
        capturedRoutingKey.Should().Be(nameof(SampleIntegrationEvent));

        // Verify body serialization
        capturedBody.Should().NotBeNull();
        var json = Encoding.UTF8.GetString(capturedBody!);
        var deserialized = JsonSerializer.Deserialize<SampleIntegrationEvent>(json);
        deserialized.Should().NotBeNull();
        deserialized!.Name.Should().Be("Hello Event");
        deserialized.MessageId.Should().Be(testEvent.MessageId);

        // Verify properties
        mockBasicProperties.VerifySet(p => p.Persistent = true, Times.Once);
        mockBasicProperties.VerifySet(p => p.ContentType = "application/json", Times.Once);
        mockBasicProperties.VerifySet(p => p.Type = nameof(SampleIntegrationEvent), Times.Once);
        mockBasicProperties.VerifySet(p => p.MessageId = testEvent.MessageId.ToString(), Times.Once);
        mockBasicProperties.VerifySet(p => p.CorrelationId = "test-correlation-id-messaging", Times.Once);
    }

    [Fact]
    public async Task PublishAsync_WhenConnectionThrows_HandlesExceptionGracefully()
    {
        // Arrange
        var options = Options.Create(new RabbitMqOptions
        {
            HostName = "localhost",
            ExchangeName = "test-exchange"
        });

        var mockConnectionFactory = new Mock<IConnectionFactory>();
        mockConnectionFactory.Setup(f => f.CreateConnection()).Throws(new InvalidOperationException("Failed to connect to RabbitMQ broker."));

        using var eventBus = new RabbitMqEventBus(options, NullLogger<RabbitMqEventBus>.Instance, mockConnectionFactory.Object);

        // Act & Assert
        Func<Task> act = async () => await eventBus.PublishAsync(new SampleIntegrationEvent());
        await act.Should().NotThrowAsync();
    }
}
