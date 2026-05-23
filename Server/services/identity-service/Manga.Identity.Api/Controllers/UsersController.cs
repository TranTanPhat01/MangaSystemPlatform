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

    public UsersController(IAuthService authService)
    {
        _authService = authService;
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
}
