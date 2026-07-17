using FluentValidation;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Validation;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Application.Services;

public sealed class AdminRoleService : IAdminRoleService
{
    private readonly IRoleRepository _roles;
    private readonly IPermissionRepository _permissions;
    private readonly IAdminAuditRepository _auditEvents;
    private readonly IIdentityUnitOfWork _unitOfWork;

    public AdminRoleService(IRoleRepository roles, IPermissionRepository permissions, IAdminAuditRepository auditEvents, IIdentityUnitOfWork unitOfWork)
    {
        _roles = roles;
        _permissions = permissions;
        _auditEvents = auditEvents;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<AdminRoleCatalogResponse>> CreateAsync(CreateRoleRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var error = Validate(new CreateRoleRequestValidator(), request);
        if (error is not null) return Result<AdminRoleCatalogResponse>.Failure(error);
        var name = request.Name.Trim();
        if (await _roles.ExistsByNameAsync(name, cancellationToken)) return Result<AdminRoleCatalogResponse>.Failure("Role name already exists.");
        var role = new Role { Name = name, Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(), CreatedAt = DateTime.UtcNow };
        await _roles.AddAsync(role, cancellationToken);
        await AddAuditAsync(actorUserId, role.Id, "RoleCreated", "Custom role created.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AdminRoleCatalogResponse>.Success(ToResponse(role));
    }

    public async Task<Result<AdminRoleCatalogResponse>> UpdateAsync(Guid roleId, UpdateRoleRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var error = Validate(new UpdateRoleRequestValidator(), request);
        if (error is not null) return Result<AdminRoleCatalogResponse>.Failure(error);
        var role = await _roles.GetByIdAsync(roleId, cancellationToken);
        if (role is null || role.IsRetired) return Result<AdminRoleCatalogResponse>.Failure("Role not found.");
        role.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        role.UpdatedAt = DateTime.UtcNow;
        await AddAuditAsync(actorUserId, role.Id, "RoleUpdated", "Role description updated.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AdminRoleCatalogResponse>.Success(ToResponse(role));
    }

    public async Task<Result<bool>> RetireAsync(Guid roleId, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var role = await _roles.GetByIdAsync(roleId, cancellationToken);
        if (role is null || role.IsRetired) return Result<bool>.Failure("Role not found.");
        if (role.IsSystem) return Result<bool>.Failure("System roles cannot be retired.");
        role.IsRetired = true;
        role.UpdatedAt = DateTime.UtcNow;
        await AddAuditAsync(actorUserId, role.Id, "RoleRetired", "Custom role retired.", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    public async Task<Result<AdminRoleCatalogResponse>> ReplacePermissionsAsync(Guid roleId, ReplaceRolePermissionsRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var error = Validate(new ReplaceRolePermissionsRequestValidator(), request);
        if (error is not null) return Result<AdminRoleCatalogResponse>.Failure(error);
        var role = await _roles.GetByIdAsync(roleId, cancellationToken);
        if (role is null || role.IsRetired) return Result<AdminRoleCatalogResponse>.Failure("Role not found.");
        if (role.IsSystem) return Result<AdminRoleCatalogResponse>.Failure("System role permissions are release-managed and cannot be changed at runtime.");
        var keys = request.PermissionKeys.Select(key => key.Trim()).Distinct(StringComparer.Ordinal).ToArray();
        var permissions = await _permissions.GetByKeysAsync(keys, cancellationToken);
        if (permissions.Count != keys.Length) return Result<AdminRoleCatalogResponse>.Failure("One or more permissions do not exist.");
        role.RolePermissions.Clear();
        foreach (var permission in permissions) role.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id, Permission = permission, CreatedAt = DateTime.UtcNow });
        role.UpdatedAt = DateTime.UtcNow;
        await AddAuditAsync(actorUserId, role.Id, "RolePermissionsReplaced", $"PermissionCount={permissions.Count}", cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AdminRoleCatalogResponse>.Success(ToResponse(role));
    }

    private Task AddAuditAsync(Guid actorUserId, Guid targetId, string action, string details, CancellationToken cancellationToken) =>
        _auditEvents.AddAsync(new AdminAuditEvent { ActorUserId = actorUserId, TargetUserId = targetId, Action = action, Details = details }, cancellationToken);

    private static string? Validate<T>(IValidator<T> validator, T request)
    {
        var result = validator.Validate(request);
        return result.IsValid ? null : string.Join(" ", result.Errors.Select(error => error.ErrorMessage));
    }

    private static AdminRoleCatalogResponse ToResponse(Role role) => new()
    {
        Id = role.Id, Name = role.Name, Description = role.Description,
        Permissions = role.RolePermissions.Select(mapping => mapping.Permission?.Key).Where(key => key is not null).Select(key => key!).OrderBy(key => key).ToArray()
    };
}
