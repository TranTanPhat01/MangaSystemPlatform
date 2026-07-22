using FluentAssertions;
using Grpc.Core;
using Grpc.Core.Interceptors;
using Grpc.Net.Client;
using Manga.BuildingBlocks.Grpc;
using Manga.BuildingBlocks.Middleware;
using Manga.Contracts.Identity.V1;
using Manga.Identity.Api.GrpcServices;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Domain.Entities;
using Manga.Identity.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class CorrelationIdInterceptorTests
{
    private class CapturingUserRepository : IUserRepository
    {
        public string? CapturedCorrelationId { get; private set; }

        public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            CapturedCorrelationId = CorrelationIdContext.Current;
            return Task.FromResult<User?>(new User
            {
                Id = id,
                Email = "test@manga.local",
                FullName = "Test User",
                Status = UserStatus.Active
            });
        }

        public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<bool> ExistsByNormalizedUsernameAsync(string normalizedUsername, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<User>>(Array.Empty<User>());
        public Task<IReadOnlyList<AssistantDirectoryItemResponse>> GetActiveAssistantsAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AssistantDirectoryItemResponse>>(Array.Empty<AssistantDirectoryItemResponse>());
        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) => Task.FromResult<User?>(null);
        public Task AddAsync(User user, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    [Fact]
    public async Task ClientInterceptor_SendsCorrelationId_WhenPresentInContext()
    {
        // Arrange
        CorrelationIdContext.Current = "test-correlation-id-from-client";
        var capturingRepo = new CapturingUserRepository();
        using var host = new GrpcTestHost(
            services => services.AddSingleton<IUserRepository>(capturingRepo),
            endpoints => endpoints.MapGrpcService<IdentityGrpcServiceImpl>());

        var clientConfig = new ConfigurationBuilder().Build();
        var client = host.CreateClient(channel =>
        {
            var invoker = channel.Intercept(new InternalGrpcClientInterceptor(
                clientConfig,
                NullLogger<InternalGrpcClientInterceptor>.Instance));
            return new IdentityGrpcService.IdentityGrpcServiceClient(invoker);
        });

        // Act
        await client.CheckUserExistsAsync(
            new CheckUserExistsRequest { UserId = Guid.NewGuid().ToString() },
            GrpcTestHost.ValidMetadata());

        // Assert
        capturingRepo.CapturedCorrelationId.Should().Be("test-correlation-id-from-client");
    }

    [Fact]
    public async Task ServerInterceptor_ReceivesCorrelationId_WhenPresentInHeaders()
    {
        // Arrange
        var capturingRepo = new CapturingUserRepository();
        using var host = new GrpcTestHost(
            services => services.AddSingleton<IUserRepository>(capturingRepo),
            endpoints => endpoints.MapGrpcService<IdentityGrpcServiceImpl>());

        var client = host.CreateClient(channel => new IdentityGrpcService.IdentityGrpcServiceClient(channel));

        var headers = GrpcTestHost.ValidMetadata();
        headers.Add("x-correlation-id", "server-test-correlation-id");

        // Act
        await client.CheckUserExistsAsync(
            new CheckUserExistsRequest { UserId = Guid.NewGuid().ToString() },
            headers);

        // Assert
        capturingRepo.CapturedCorrelationId.Should().Be("server-test-correlation-id");
    }

    [Fact]
    public async Task ServerInterceptor_CreatesCorrelationId_WhenMissingInHeaders()
    {
        // Arrange
        var capturingRepo = new CapturingUserRepository();
        using var host = new GrpcTestHost(
            services => services.AddSingleton<IUserRepository>(capturingRepo),
            endpoints => endpoints.MapGrpcService<IdentityGrpcServiceImpl>());

        var client = host.CreateClient(channel => new IdentityGrpcService.IdentityGrpcServiceClient(channel));

        // Act
        await client.CheckUserExistsAsync(
            new CheckUserExistsRequest { UserId = Guid.NewGuid().ToString() },
            GrpcTestHost.ValidMetadata());

        // Assert
        capturingRepo.CapturedCorrelationId.Should().NotBeNullOrWhiteSpace();
        Guid.TryParse(capturingRepo.CapturedCorrelationId, out _).Should().BeTrue();
    }
}
