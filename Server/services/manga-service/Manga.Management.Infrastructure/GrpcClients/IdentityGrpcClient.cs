using Grpc.Core;
using Manga.Contracts.Identity.V1;
using Manga.Management.Application.Abstractions;
using Manga.Management.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Manga.Management.Infrastructure.GrpcClients;

internal sealed class IdentityGrpcClient : IIdentityLookupClient
{
    private readonly IdentityGrpcService.IdentityGrpcServiceClient _client;
    private readonly ILogger<IdentityGrpcClient> _logger;
    private readonly int _timeoutSeconds;

    public IdentityGrpcClient(
        IdentityGrpcService.IdentityGrpcServiceClient client,
        IConfiguration configuration,
        ILogger<IdentityGrpcClient> logger)
    {
        _client = client;
        _logger = logger;
        _timeoutSeconds = configuration.GetValue("Grpc:Identity:TimeoutSeconds", 2);
    }

    public async Task<bool> CheckUserExistsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Checking assigned user {UserId} through Identity gRPC.", userId);

            var response = await _client.CheckUserExistsAsync(
                new CheckUserExistsRequest { UserId = userId.ToString() },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);

            return response.Exists && response.IsActive;
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Identity gRPC lookup failed for user {UserId}.", userId);
            return false;
        }
    }

    public async Task<UserSummaryDto?> GetUserSummaryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting user summary {UserId} through Identity gRPC.", userId);

            var response = await _client.GetUserSummaryAsync(
                new GetUserSummaryRequest { UserId = userId.ToString() },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);

            if (!Guid.TryParse(response.UserId, out var parsedUserId))
            {
                return null;
            }

            return new UserSummaryDto
            {
                UserId = parsedUserId,
                DisplayName = response.DisplayName,
                Email = response.Email,
                Roles = response.Roles.ToArray(),
                IsActive = response.IsActive
            };
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Identity gRPC summary lookup failed for user {UserId}.", userId);
            return null;
        }
    }

    public async Task<bool> CheckUserRoleAsync(Guid userId, string role, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Checking user {UserId} role {Role} through Identity gRPC.", userId, role);

            var response = await _client.CheckUserRoleAsync(
                new CheckUserRoleRequest
                {
                    UserId = userId.ToString(),
                    Role = role
                },
                deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
                cancellationToken: cancellationToken);

            return response.HasRole && response.IsActive;
        }
        catch (RpcException exception)
        {
            _logger.LogWarning(exception, "Identity gRPC role lookup failed for user {UserId} and role {Role}.", userId, role);
            return false;
        }
    }
}
