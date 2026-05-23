using Microsoft.AspNetCore.Mvc;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Services;

namespace Manga.Identity.Api.Controllers;

[ApiController]
[Route("identity/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            ThrowIdentityException(result.Error);
        }

        return Ok(ApiResponse<AuthResponse>.Ok(result.Value!));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            throw new UnauthorizedException(result.Error ?? "Invalid email or password.", "INVALID_CREDENTIALS");
        }

        return Ok(ApiResponse<AuthResponse>.Ok(result.Value!));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            throw new UnauthorizedException(result.Error ?? "Invalid refresh token.", "INVALID_REFRESH_TOKEN");
        }

        return Ok(ApiResponse<AuthResponse>.Ok(result.Value!));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LogoutAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            throw new BadRequestException(result.Error ?? "Invalid refresh token.", "INVALID_REFRESH_TOKEN");
        }

        return Ok(ApiResponse<object>.Ok("Logged out successfully"));
    }

    private static void ThrowIdentityException(string? error)
    {
        if (error?.Contains("already exists", StringComparison.OrdinalIgnoreCase) == true)
        {
            throw new ConflictException(error, "EMAIL_ALREADY_EXISTS");
        }

        throw new BadRequestException(error ?? "Identity request failed.", "IDENTITY_REQUEST_FAILED");
    }
}
