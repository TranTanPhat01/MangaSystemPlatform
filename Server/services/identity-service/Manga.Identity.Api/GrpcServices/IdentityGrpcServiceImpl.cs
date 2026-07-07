using Grpc.Core;
using Manga.Contracts.Identity.V1;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Domain.Enums;

namespace Manga.Identity.Api.GrpcServices;

public sealed class IdentityGrpcServiceImpl : IdentityGrpcService.IdentityGrpcServiceBase
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<IdentityGrpcServiceImpl> _logger;

    public IdentityGrpcServiceImpl(
        IUserRepository userRepository,
        ILogger<IdentityGrpcServiceImpl> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    public override async Task<CheckUserExistsResponse> CheckUserExists(
        CheckUserExistsRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            _logger.LogWarning("Invalid user id received through Identity gRPC: {UserId}", request.UserId);
            return InactiveResponse();
        }

        var user = await _userRepository.GetByIdAsync(userId, context.CancellationToken);
        if (user is null)
        {
            return InactiveResponse();
        }

        return new CheckUserExistsResponse
        {
            Exists = true,
            IsActive = user.Status == UserStatus.Active
        };
    }

    public override async Task<GetUserSummaryResponse> GetUserSummary(
        GetUserSummaryRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            _logger.LogWarning("Invalid user id received through Identity gRPC summary lookup: {UserId}", request.UserId);
            return new GetUserSummaryResponse();
        }

        var user = await _userRepository.GetByIdAsync(userId, context.CancellationToken);
        if (user is null)
        {
            return new GetUserSummaryResponse();
        }

        _logger.LogInformation("Identity gRPC summary lookup succeeded for user {UserId}.", userId);

        var response = new GetUserSummaryResponse
        {
            UserId = user.Id.ToString(),
            DisplayName = user.FullName,
            Email = user.Email,
            IsActive = user.Status == UserStatus.Active
        };
        response.Roles.AddRange(user.UserRoles
            .Select(userRole => userRole.Role?.Name)
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role!));

        return response;
    }

    public override async Task<CheckUserRoleResponse> CheckUserRole(
        CheckUserRoleRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            _logger.LogWarning("Invalid user id received through Identity gRPC role lookup: {UserId}", request.UserId);
            return new CheckUserRoleResponse { HasRole = false, IsActive = false };
        }

        var user = await _userRepository.GetByIdAsync(userId, context.CancellationToken);
        if (user is null)
        {
            return new CheckUserRoleResponse { HasRole = false, IsActive = false };
        }

        var isActive = user.Status == UserStatus.Active;
        var hasRole = isActive && user.UserRoles.Any(userRole =>
            string.Equals(userRole.Role?.Name, request.Role, StringComparison.OrdinalIgnoreCase));

        _logger.LogInformation(
            "Identity gRPC role lookup succeeded for user {UserId} and role {Role}. HasRole={HasRole}",
            userId,
            request.Role,
            hasRole);

        return new CheckUserRoleResponse
        {
            HasRole = hasRole,
            IsActive = isActive
        };
    }

    private static CheckUserExistsResponse InactiveResponse() => new()
    {
        Exists = false,
        IsActive = false
    };
}
