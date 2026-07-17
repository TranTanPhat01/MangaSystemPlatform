using System.Security.Claims;
using Manga.BuildingBlocks.Authorization;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Manga.Identity.Api.Controllers;

[ApiController]
[Route("identity/admin/roles")]
public sealed class AdminRolesController : ControllerBase
{
    private readonly IAdminRoleService _roles;

    public AdminRolesController(IAdminRoleService roles) => _roles = roles;

    [Authorize(Policy = PermissionPolicies.RequireAdminRoleManage)]
    [HttpPost]
    public Task<IActionResult> Create(CreateRoleRequest request, CancellationToken cancellationToken) => ToResponse(_roles.CreateAsync(request, ActorId(), cancellationToken));

    [Authorize(Policy = PermissionPolicies.RequireAdminRoleManage)]
    [HttpPatch("{roleId:guid}")]
    public Task<IActionResult> Update(Guid roleId, UpdateRoleRequest request, CancellationToken cancellationToken) => ToResponse(_roles.UpdateAsync(roleId, request, ActorId(), cancellationToken));

    [Authorize(Policy = PermissionPolicies.RequireAdminRoleManage)]
    [HttpDelete("{roleId:guid}")]
    public async Task<IActionResult> Retire(Guid roleId, CancellationToken cancellationToken)
    {
        var result = await _roles.RetireAsync(roleId, ActorId(), cancellationToken);
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Unable to retire role.", "ROLE_RETIRE_FAILED");
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [Authorize(Policy = PermissionPolicies.RequireAdminRolePermissionManage)]
    [HttpPut("{roleId:guid}/permissions")]
    public Task<IActionResult> ReplacePermissions(Guid roleId, ReplaceRolePermissionsRequest request, CancellationToken cancellationToken) => ToResponse(_roles.ReplacePermissionsAsync(roleId, request, ActorId(), cancellationToken));

    private async Task<IActionResult> ToResponse(Task<Application.Common.Result<AdminRoleCatalogResponse>> operation)
    {
        var result = await operation;
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Role operation failed.", "ROLE_OPERATION_FAILED");
        return Ok(ApiResponse<AdminRoleCatalogResponse>.Ok(result.Value!));
    }

    private Guid ActorId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
        ? id : throw new UnauthorizedException("Invalid access token.", "INVALID_ACCESS_TOKEN");
}
