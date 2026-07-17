using Manga.Identity.Domain.Enums;

namespace Manga.Identity.Domain.Entities;

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? NormalizedUsername { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserStatus Status { get; set; } = UserStatus.Active;
    public bool EmailVerified { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LockoutUntil { get; set; }
    public string? LockReason { get; set; }
    public Guid? LockedByUserId { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public bool CanAuthenticate(DateTime utcNow) => GetAuthenticationFailureCategory(utcNow) is null;

    public string? GetAuthenticationFailureCategory(DateTime utcNow)
    {
        if (DeletedAt is not null) return "SoftDeleted";
        if (Status == UserStatus.Disabled) return "Disabled";
        if (Status == UserStatus.Locked && LockoutUntil is null) return "ManualLock";
        if (LockoutUntil is not null && LockoutUntil > utcNow) return "ActiveTemporaryLockout";
        return null;
    }

    public bool ClearExpiredTemporaryLockout(DateTime utcNow)
    {
        if (LockoutUntil is null || LockoutUntil > utcNow) return false;
        if (Status == UserStatus.Locked) Status = UserStatus.Active;
        LockoutUntil = null;
        LockReason = null;
        LockedByUserId = null;
        UpdatedAt = utcNow;
        return true;
    }
}
