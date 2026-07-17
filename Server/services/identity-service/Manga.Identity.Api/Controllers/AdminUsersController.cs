using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.BuildingBlocks.Authorization;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Services;

namespace Manga.Identity.Api.Controllers;

[ApiController]
[Route("identity/admin")]
public sealed class AdminUsersController : ControllerBase
{
    private readonly IUserAdminService _userAdminService;

    public AdminUsersController(IUserAdminService userAdminService) => _userAdminService = userAdminService;

    [Authorize(Policy = PermissionPolicies.RequireAdminUserRead)]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUserListQuery query, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.GetUsersAsync(query, cancellationToken);
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Invalid user list query.", "INVALID_USER_LIST_QUERY");
        return Ok(ApiResponse<PagedResponse<AdminUserListItemResponse>>.Ok(result.Value!));
    }

    [Authorize(Policy = PermissionPolicies.RequireAdminUserRead)]
    [HttpGet("users/{userId:guid}")]
    public async Task<IActionResult> GetUser(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.GetUserDetailAsync(userId, cancellationToken);
        if (!result.IsSuccess) throw new NotFoundException(result.Error ?? "User not found.", "USER_NOT_FOUND");
        return Ok(ApiResponse<AdminUserDetailResponse>.Ok(result.Value!));
    }

    [Authorize(Policy = PermissionPolicies.RequireAdminRoleRead)]
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
    {
        var result = await _userAdminService.GetRoleCatalogAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AdminRoleCatalogResponse>>.Ok(result.Value!));
    }

    [Authorize(Policy = PermissionPolicies.RequireAdminUserCreate)]
    [HttpPost("users")]
    public Task<IActionResult> Create(CreateAdminUserRequest request, CancellationToken cancellationToken) =>
        UpdateAsync(_userAdminService.CreateUserAsync(request, GetActorUserId(), cancellationToken));

    [Authorize(Policy = PermissionPolicies.RequireAdminUserUpdate)]
    [HttpPatch("users/{userId:guid}")]
    public Task<IActionResult> Update(Guid userId, UpdateAdminUserRequest request, CancellationToken cancellationToken) =>
        UpdateAsync(_userAdminService.UpdateUserAsync(userId, request, GetActorUserId(), cancellationToken));

    [Authorize(Policy = PermissionPolicies.RequireAdminUserDelete)]
    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> Delete(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.SoftDeleteUserAsync(userId, GetActorUserId(), cancellationToken);
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Unable to delete user.", "USER_DELETE_FAILED");
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [Authorize(Policy = PermissionPolicies.RequireAdminUserUpdate)]
    [HttpPost("users/{userId:guid}/lock")]
    public Task<IActionResult> Lock(Guid userId, LockUserRequest request, CancellationToken cancellationToken) =>
        UpdateAsync(_userAdminService.LockUserAsync(userId, request, GetActorUserId(), cancellationToken));

    [Authorize(Policy = PermissionPolicies.RequireAdminUserUpdate)]
    [HttpPost("users/{userId:guid}/unlock")]
    public Task<IActionResult> Unlock(Guid userId, CancellationToken cancellationToken) =>
        UpdateAsync(_userAdminService.UnlockUserAsync(userId, GetActorUserId(), cancellationToken));

    [Authorize(Policy = PermissionPolicies.RequireAdminUserResetPassword)]
    [HttpPost("users/{userId:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid userId, ResetUserPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.ResetPasswordAsync(userId, request, GetActorUserId(), cancellationToken);
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Unable to reset password.", "PASSWORD_RESET_FAILED");
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [Authorize(Policy = PermissionPolicies.RequireAdminUserSessionRevoke)]
    [HttpPost("users/{userId:guid}/revoke-sessions")]
    public async Task<IActionResult> RevokeSessions(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.RevokeSessionsAsync(userId, GetActorUserId(), cancellationToken);
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Unable to revoke sessions.", "SESSION_REVOKE_FAILED");
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [Authorize(Policy = PermissionPolicies.RequireAdminUserManage)]
    [HttpPatch("users/{userId:guid}/status")]
    public Task<IActionResult> UpdateStatus(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken) =>
        UpdateAsync(_userAdminService.UpdateStatusAsync(userId, request, GetActorUserId(), cancellationToken));

    [Authorize(Policy = PermissionPolicies.RequireAdminUserManage)]
    [HttpPatch("users/{userId:guid}/roles")]
    public Task<IActionResult> UpdateRoles(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken) =>
        UpdateAsync(_userAdminService.UpdateRolesAsync(userId, request, GetActorUserId(), cancellationToken));

    private async Task<IActionResult> UpdateAsync(Task<Application.Common.Result<AdminUserResponse>> operation)
    {
        var result = await operation;
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Unable to update user.", "USER_UPDATE_FAILED");
        return Ok(ApiResponse<AdminUserResponse>.Ok(result.Value!));
    }

    private Guid GetActorUserId()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            throw new UnauthorizedException("Invalid access token.", "INVALID_ACCESS_TOKEN");
        return userId;
    }
}
