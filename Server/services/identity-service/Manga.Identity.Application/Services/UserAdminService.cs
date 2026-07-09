using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Application.Services;

public sealed class UserAdminService : IUserAdminService
{
    private readonly IUserRepository _users;
    private readonly IRoleRepository _roles;
    private readonly IIdentityUnitOfWork _unitOfWork;

    public UserAdminService(IUserRepository users, IRoleRepository roles, IIdentityUnitOfWork unitOfWork)
    {
        _users = users;
        _roles = roles;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IReadOnlyList<AdminUserResponse>>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _users.ListAsync(cancellationToken);
        return Result<IReadOnlyList<AdminUserResponse>>.Success(users.Select(ToResponse).ToArray());
    }

    public async Task<Result<AdminUserResponse>> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result<AdminUserResponse>.Failure("User not found.");
        }

        user.Status = request.Status;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<AdminUserResponse>.Success(ToResponse(user));
    }

    public async Task<Result<AdminUserResponse>> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result<AdminUserResponse>.Failure("User not found.");
        }

        var requestedRoleNames = request.Roles
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (requestedRoleNames.Length == 0)
        {
            return Result<AdminUserResponse>.Failure("At least one role is required.");
        }

        var availableRoles = await _roles.ListAsync(cancellationToken);
        var selectedRoles = new List<Role>();
        foreach (var roleName in requestedRoleNames)
        {
            var role = availableRoles.FirstOrDefault(candidate => candidate.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase));
            if (role is null)
            {
                return Result<AdminUserResponse>.Failure($"Role '{roleName}' not found.");
            }

            selectedRoles.Add(role);
        }

        user.UserRoles.Clear();
        foreach (var role in selectedRoles)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                Role = role
            });
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<AdminUserResponse>.Success(ToResponse(user));
    }

    private static AdminUserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        Status = user.Status,
        Roles = user.UserRoles
            .Select(userRole => userRole.Role?.Name)
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role!)
            .ToArray(),
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };
}
