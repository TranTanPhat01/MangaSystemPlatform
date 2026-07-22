using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Domain.Entities;
using Manga.Identity.Domain.Enums;
using Manga.Identity.Application.Validation;
using FluentValidation;

namespace Manga.Identity.Application.Services;

public sealed class UserAdminService : IUserAdminService
{
    private const string AdminRoleName = "Admin";
    private readonly IUserRepository _users;
    private readonly IRoleRepository _roles;
    private readonly IAdminUserRepository _adminUsers;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IAdminAuditRepository _auditEvents;
    private readonly IIdentityUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public UserAdminService(IUserRepository users, IRoleRepository roles, IAdminUserRepository adminUsers, IRefreshTokenRepository refreshTokens, IAdminAuditRepository auditEvents, IIdentityUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _users = users;
        _roles = roles;
        _adminUsers = adminUsers;
        _refreshTokens = refreshTokens;
        _auditEvents = auditEvents;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public Task<IReadOnlyList<AssistantDirectoryItemResponse>> GetActiveAssistantsAsync(CancellationToken cancellationToken = default) =>
        _users.GetActiveAssistantsAsync(cancellationToken);

    public async Task<Result<PagedResponse<AdminUserListItemResponse>>> GetUsersAsync(AdminUserListQuery query, CancellationToken cancellationToken = default)
    {
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            return Result<PagedResponse<AdminUserListItemResponse>>.Failure("Page must be at least 1 and pageSize must be between 1 and 100.");
        if (!string.IsNullOrWhiteSpace(query.Status) && !Enum.TryParse<UserStatus>(query.Status, true, out _))
            return Result<PagedResponse<AdminUserListItemResponse>>.Failure("Status is invalid.");
        var sortBy = query.SortBy?.ToLowerInvariant();
        var sortDirection = query.SortDirection?.ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(sortBy) && sortBy is not ("createdat" or "email" or "name"))
            return Result<PagedResponse<AdminUserListItemResponse>>.Failure("sortBy must be createdAt, email, or name.");
        if (!string.IsNullOrWhiteSpace(sortDirection) && sortDirection is not ("asc" or "desc"))
            return Result<PagedResponse<AdminUserListItemResponse>>.Failure("sortDirection must be asc or desc.");

        query.SortBy = sortBy;
        query.SortDirection = sortDirection;

        return Result<PagedResponse<AdminUserListItemResponse>>.Success(await _adminUsers.SearchAsync(query, cancellationToken));
    }

    public async Task<Result<AdminUserDetailResponse>> GetUserDetailAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _adminUsers.GetDetailAsync(userId, cancellationToken);
        return user is null ? Result<AdminUserDetailResponse>.Failure("User not found.") : Result<AdminUserDetailResponse>.Success(user);
    }

    public async Task<Result<IReadOnlyList<AdminRoleCatalogResponse>>> GetRoleCatalogAsync(CancellationToken cancellationToken = default) =>
        Result<IReadOnlyList<AdminRoleCatalogResponse>>.Success(await _adminUsers.GetRoleCatalogAsync(cancellationToken));

    public async Task<Result<AdminUserResponse>> CreateUserAsync(CreateAdminUserRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var error = Validate(new CreateAdminUserRequestValidator(), request);
        if (error is not null) return Result<AdminUserResponse>.Failure(error);
        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim();
        var normalizedUsername = NormalizeUsername(username);
        if (await _users.ExistsByEmailAsync(email, cancellationToken)) return Result<AdminUserResponse>.Failure("Email already exists.");
        if (await _users.ExistsByNormalizedUsernameAsync(normalizedUsername, cancellationToken)) return Result<AdminUserResponse>.Failure("Username already exists.");
        var selectedRoles = await ResolveRolesAsync(request.Roles, cancellationToken);
        if (selectedRoles is null) return Result<AdminUserResponse>.Failure("One or more roles were not found or retired.");

        var user = new User
        {
            Email = email,
            Username = username,
            NormalizedUsername = normalizedUsername,
            FullName = request.FullName.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UserRoles = selectedRoles.Select(role => new UserRole { RoleId = role.Id, Role = role }).ToList()
        };
        await _users.AddAsync(user, cancellationToken);
        await AddAuditAsync(actorUserId, user.Id, "UserCreated", "User account created by administrator.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AdminUserResponse>.Success(ToResponse(user));
    }

    public async Task<Result<AdminUserResponse>> UpdateUserAsync(Guid userId, UpdateAdminUserRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var error = Validate(new UpdateAdminUserRequestValidator(), request);
        if (error is not null) return Result<AdminUserResponse>.Failure(error);
        var user = await _users.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.DeletedAt is not null) return Result<AdminUserResponse>.Failure("User not found.");
        var username = request.Username.Trim();
        var normalizedUsername = NormalizeUsername(username);
        if (!string.Equals(user.NormalizedUsername, normalizedUsername, StringComparison.Ordinal) && await _users.ExistsByNormalizedUsernameAsync(normalizedUsername, cancellationToken))
            return Result<AdminUserResponse>.Failure("Username already exists.");
        user.Username = username;
        user.NormalizedUsername = normalizedUsername;
        user.FullName = request.FullName.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await AddAuditAsync(actorUserId, user.Id, "UserUpdated", "User profile updated by administrator.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AdminUserResponse>.Success(ToResponse(user));
    }

    public async Task<Result<bool>> SoftDeleteUserAsync(Guid userId, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _unitOfWork.ExecuteSerializableAsync(async ct =>
            {
                var user = await _users.GetByIdAsync(userId, ct);
                if (user is null || user.DeletedAt is not null) return Result<bool>.Failure("User not found.");
                if (IsAdmin(user) && user.Status == UserStatus.Active && await _adminUsers.CountActiveUsersInRoleAsync(AdminRoleName, ct) <= 1)
                    return Result<bool>.Failure("The last active Admin cannot be deleted.");
                user.DeletedAt = DateTime.UtcNow;
                user.DeletedByUserId = actorUserId;
                user.UpdatedAt = user.DeletedAt;
                await _refreshTokens.RevokeActiveByUserIdAsync(user.Id, ct);
                await AddAuditAsync(actorUserId, user.Id, "UserSoftDeleted", "User account soft deleted by administrator.", ct);
                await _unitOfWork.SaveChangesAsync(ct);
                return Result<bool>.Success(true);
            }, cancellationToken);
        }
        catch (IdentityConcurrencyException)
        {
            return Result<bool>.Failure("Admin state changed concurrently. Retry the operation.");
        }
    }

    public async Task<Result<AdminUserResponse>> LockUserAsync(Guid userId, LockUserRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var error = Validate(new LockUserRequestValidator(), request);
        if (error is not null) return Result<AdminUserResponse>.Failure(error);
        try
        {
            return await _unitOfWork.ExecuteSerializableAsync(async ct =>
            {
                var user = await _users.GetByIdAsync(userId, ct);
                if (user is null || user.DeletedAt is not null) return Result<AdminUserResponse>.Failure("User not found.");
                if (IsAdmin(user) && user.Status == UserStatus.Active && await _adminUsers.CountActiveUsersInRoleAsync(AdminRoleName, ct) <= 1)
                    return Result<AdminUserResponse>.Failure("The last active Admin cannot be locked.");
                user.Status = request.LockoutUntil.HasValue ? UserStatus.Active : UserStatus.Locked;
                user.LockoutUntil = request.LockoutUntil;
                user.LockReason = request.Reason.Trim();
                user.LockedByUserId = actorUserId;
                user.UpdatedAt = DateTime.UtcNow;
                await _refreshTokens.RevokeActiveByUserIdAsync(user.Id, ct);
                await AddAuditAsync(actorUserId, user.Id, request.LockoutUntil.HasValue ? "UserTemporaryLockout" : "UserLocked", "User account lock state changed by administrator.", ct);
                await _unitOfWork.SaveChangesAsync(ct);
                return Result<AdminUserResponse>.Success(ToResponse(user));
            }, cancellationToken);
        }
        catch (IdentityConcurrencyException)
        {
            return Result<AdminUserResponse>.Failure("Admin state changed concurrently. Retry the operation.");
        }
    }

    public async Task<Result<AdminUserResponse>> UnlockUserAsync(Guid userId, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.DeletedAt is not null) return Result<AdminUserResponse>.Failure("User not found.");
        user.Status = UserStatus.Active;
        user.LockoutUntil = null;
        user.LockReason = null;
        user.LockedByUserId = null;
        user.UpdatedAt = DateTime.UtcNow;
        await AddAuditAsync(actorUserId, user.Id, "UserUnlocked", "User account unlocked by administrator.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AdminUserResponse>.Success(ToResponse(user));
    }

    public async Task<Result<bool>> ResetPasswordAsync(Guid userId, ResetUserPasswordRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var error = Validate(new ResetUserPasswordRequestValidator(), request);
        if (error is not null) return Result<bool>.Failure(error);
        var user = await _users.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.DeletedAt is not null) return Result<bool>.Failure("User not found.");
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _refreshTokens.RevokeActiveByUserIdAsync(user.Id, cancellationToken);
        await AddAuditAsync(actorUserId, user.Id, "UserPasswordReset", "User password reset by administrator.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RevokeSessionsAsync(Guid userId, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.DeletedAt is not null) return Result<bool>.Failure("User not found.");
        await _refreshTokens.RevokeActiveByUserIdAsync(user.Id, cancellationToken);
        await AddAuditAsync(actorUserId, user.Id, "UserSessionsRevoked", "All user sessions revoked by administrator.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<AdminUserResponse>> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _unitOfWork.ExecuteSerializableAsync(async ct =>
            {
                var user = await _users.GetByIdAsync(userId, ct);
                if (user is null || user.DeletedAt is not null) return Result<AdminUserResponse>.Failure("User not found.");
                if (!Enum.IsDefined(request.Status)) return Result<AdminUserResponse>.Failure("Status is invalid.");
                if (request.Status == UserStatus.Locked) return Result<AdminUserResponse>.Failure("Use the lock endpoint to lock a user with an audit reason.");
                if (request.Status != UserStatus.Active && IsAdmin(user) && await _adminUsers.CountActiveUsersInRoleAsync(AdminRoleName, ct) <= 1)
                    return Result<AdminUserResponse>.Failure("The last active Admin cannot be disabled or locked.");
                user.Status = request.Status;
                user.LockoutUntil = null;
                user.LockReason = null;
                user.LockedByUserId = null;
                user.UpdatedAt = DateTime.UtcNow;
                if (request.Status == UserStatus.Disabled) await _refreshTokens.RevokeActiveByUserIdAsync(user.Id, ct);
                await AddAuditAsync(actorUserId, user.Id, "UserStatusUpdated", $"Status={request.Status}", ct);
                await _unitOfWork.SaveChangesAsync(ct);
                return Result<AdminUserResponse>.Success(ToResponse(user));
            }, cancellationToken);
        }
        catch (IdentityConcurrencyException)
        {
            return Result<AdminUserResponse>.Failure("Admin state changed concurrently. Retry the operation.");
        }
    }

    public async Task<Result<AdminUserResponse>> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _unitOfWork.ExecuteSerializableAsync(async ct =>
            {
                var user = await _users.GetByIdAsync(userId, ct);
                if (user is null || user.DeletedAt is not null) return Result<AdminUserResponse>.Failure("User not found.");
                var requestedNames = request.Roles.Where(role => !string.IsNullOrWhiteSpace(role)).Select(role => role.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
                if (requestedNames.Length == 0) return Result<AdminUserResponse>.Failure("At least one role is required.");
                var selectedRoles = await ResolveRolesAsync(requestedNames, ct);
                if (selectedRoles is null) return Result<AdminUserResponse>.Failure("One or more roles were not found or retired.");
                var willRemainAdmin = selectedRoles.Any(role => role.Name.Equals(AdminRoleName, StringComparison.OrdinalIgnoreCase));
                if (IsAdmin(user) && !willRemainAdmin && user.Status == UserStatus.Active && await _adminUsers.CountActiveUsersInRoleAsync(AdminRoleName, ct) <= 1)
                    return Result<AdminUserResponse>.Failure("The Admin role cannot be removed from the last active Admin.");
                user.UserRoles.Clear();
                foreach (var role in selectedRoles) user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id, Role = role });
                user.UpdatedAt = DateTime.UtcNow;
                await AddAuditAsync(actorUserId, user.Id, "UserRolesUpdated", $"Roles={string.Join(',', selectedRoles.Select(role => role.Name))}", ct);
                await _unitOfWork.SaveChangesAsync(ct);
                return Result<AdminUserResponse>.Success(ToResponse(user));
            }, cancellationToken);
        }
        catch (IdentityConcurrencyException)
        {
            return Result<AdminUserResponse>.Failure("Admin state changed concurrently. Retry the operation.");
        }
    }

    private Task AddAuditAsync(Guid actorUserId, Guid targetUserId, string action, string details, CancellationToken cancellationToken) =>
        _auditEvents.AddAsync(new AdminAuditEvent { ActorUserId = actorUserId, TargetUserId = targetUserId, Action = action, Details = details }, cancellationToken);

    private async Task<IReadOnlyList<Role>?> ResolveRolesAsync(IEnumerable<string> roleNames, CancellationToken cancellationToken)
    {
        var requestedNames = roleNames.Where(role => !string.IsNullOrWhiteSpace(role)).Select(role => role.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (requestedNames.Length == 0) return null;
        var availableRoles = await _roles.ListAsync(cancellationToken);
        var selectedRoles = requestedNames.Select(name => availableRoles.FirstOrDefault(role => role.Name.Equals(name, StringComparison.OrdinalIgnoreCase) && !role.IsRetired)).ToArray();
        return selectedRoles.Any(role => role is null) ? null : selectedRoles.Cast<Role>().ToArray();
    }

    private static string? Validate<T>(IValidator<T> validator, T request)
    {
        var result = validator.Validate(request);
        return result.IsValid ? null : string.Join(" ", result.Errors.Select(error => error.ErrorMessage));
    }

    private static bool IsAdmin(User user) => user.UserRoles.Any(userRole => userRole.Role?.Name.Equals(AdminRoleName, StringComparison.OrdinalIgnoreCase) == true);
    private static string NormalizeUsername(string username) => username.Trim().ToUpperInvariant();
    private static AdminUserResponse ToResponse(User user) => new() { Id = user.Id, Email = user.Email, Username = user.Username, FullName = user.FullName, Status = user.Status, Roles = user.UserRoles.Select(userRole => userRole.Role?.Name).Where(role => !string.IsNullOrWhiteSpace(role)).Select(role => role!).ToArray(), CreatedAt = user.CreatedAt, UpdatedAt = user.UpdatedAt };
}
