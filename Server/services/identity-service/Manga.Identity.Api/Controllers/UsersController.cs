using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Services;

namespace Manga.Identity.Api.Controllers;

[ApiController]
[Route("identity/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserAdminService _userAdminService;

    public UsersController(IAuthService authService, IUserAdminService userAdminService)
    {
        _authService = authService;
        _userAdminService = userAdminService;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("Invalid access token.", "INVALID_ACCESS_TOKEN");
        }

        var result = await _authService.GetCurrentUserAsync(userId, cancellationToken);
        if (!result.IsSuccess)
        {
            throw new NotFoundException(result.Error ?? "User not found.", "USER_NOT_FOUND");
        }

        return Ok(ApiResponse<UserProfileResponse>.Ok(result.Value!));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        var result = await _userAdminService.GetUsersAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AdminUserResponse>>.Ok(result.Value!));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPatch("{userId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.UpdateStatusAsync(userId, request, cancellationToken);
        if (!result.IsSuccess)
        {
            throw new NotFoundException(result.Error ?? "User not found.", "USER_NOT_FOUND");
        }

        return Ok(ApiResponse<AdminUserResponse>.Ok(result.Value!));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{userId:guid}/roles")]
    public async Task<IActionResult> UpdateRoles(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.UpdateRolesAsync(userId, request, cancellationToken);
        if (!result.IsSuccess)
        {
            throw new BadRequestException(result.Error ?? "Unable to update user roles.", "USER_ROLE_UPDATE_FAILED");
        }

        return Ok(ApiResponse<AdminUserResponse>.Ok(result.Value!));
    }
}
