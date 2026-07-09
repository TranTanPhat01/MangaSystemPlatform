using System.ComponentModel.DataAnnotations;
using Manga.Identity.Domain.Enums;

namespace Manga.Identity.Application.DTOs;

public sealed class AdminUserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserStatus Status { get; set; }
    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class UpdateUserStatusRequest
{
    [Required]
    public UserStatus Status { get; set; }
}

public sealed class UpdateUserRolesRequest
{
    [Required]
    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
}
