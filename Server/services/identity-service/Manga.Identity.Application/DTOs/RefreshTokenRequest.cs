using System.ComponentModel.DataAnnotations;

namespace Manga.Identity.Application.DTOs;

public sealed class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
