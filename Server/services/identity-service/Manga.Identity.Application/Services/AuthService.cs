using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Options;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Application.Services;

public sealed class AuthService : IAuthService
{
    private const string DefaultRoleName = "Mangaka";

    private readonly IUserRepository _users;
    private readonly IRoleRepository _roles;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IIdentityUnitOfWork _unitOfWork;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtOptionsProvider _jwtOptionsProvider;

    public AuthService(
        IUserRepository users,
        IRoleRepository roles,
        IRefreshTokenRepository refreshTokens,
        IIdentityUnitOfWork unitOfWork,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IJwtOptionsProvider jwtOptionsProvider)
    {
        _users = users;
        _roles = roles;
        _refreshTokens = refreshTokens;
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
        _jwtOptionsProvider = jwtOptionsProvider;
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);

        if (await _users.ExistsByEmailAsync(email, cancellationToken))
        {
            return Result<AuthResponse>.Failure("Email already exists.");
        }

        var defaultRole = await _roles.GetByNameAsync(DefaultRoleName, cancellationToken);
        if (defaultRole is null)
        {
            return Result<AuthResponse>.Failure("Default role is not configured.");
        }

        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
            UserRoles = new List<UserRole>
            {
                new() { RoleId = defaultRole.Id, Role = defaultRole }
            }
        };

        await _users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await CreateAuthResponseAsync(user, cancellationToken);
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByEmailAsync(NormalizeEmail(request.Email), cancellationToken);
        if (user is null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Result<AuthResponse>.Failure("Invalid email or password.");
        }

        return await CreateAuthResponseAsync(user, cancellationToken);
    }

    public async Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var refreshToken = await _refreshTokens.GetActiveTokenAsync(request.RefreshToken, cancellationToken);
        if (refreshToken?.User is null)
        {
            return Result<AuthResponse>.Failure("Invalid refresh token.");
        }

        refreshToken.RevokedAt = DateTime.UtcNow;

        var result = await CreateAuthResponseAsync(refreshToken.User, cancellationToken);
        if (!result.IsSuccess)
        {
            return result;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<Result<bool>> LogoutAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var refreshToken = await _refreshTokens.GetActiveTokenAsync(request.RefreshToken, cancellationToken);
        if (refreshToken is null)
        {
            return Result<bool>.Failure("Invalid refresh token.");
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }

    public async Task<Result<UserProfileResponse>> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result<UserProfileResponse>.Failure("User not found.");
        }

        return Result<UserProfileResponse>.Success(ToProfileResponse(user));
    }

    private async Task<Result<AuthResponse>> CreateAuthResponseAsync(User user, CancellationToken cancellationToken)
    {
        var roles = GetRoleNames(user);
        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtOptionsProvider.AccessTokenExpirationMinutes);
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = _jwtTokenService.GenerateRefreshToken(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtOptionsProvider.RefreshTokenExpirationDays)
        };

        await _refreshTokens.AddAsync(refreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user, roles, accessTokenExpiresAt),
            RefreshToken = refreshToken.Token,
            ExpiresAt = accessTokenExpiresAt,
            User = ToProfileResponse(user)
        };

        return Result<AuthResponse>.Success(response);
    }

    private static UserProfileResponse ToProfileResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        Roles = GetRoleNames(user)
    };

    private static IReadOnlyCollection<string> GetRoleNames(User user) =>
        user.UserRoles
            .Select(userRole => userRole.Role?.Name)
            .Where(roleName => !string.IsNullOrWhiteSpace(roleName))
            .Select(roleName => roleName!)
            .Distinct()
            .ToArray();

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
