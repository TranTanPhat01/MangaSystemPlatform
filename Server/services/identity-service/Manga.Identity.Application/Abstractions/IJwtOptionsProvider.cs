namespace Manga.Identity.Application.Abstractions;

public interface IJwtOptionsProvider
{
    int AccessTokenExpirationMinutes { get; }
    int RefreshTokenExpirationDays { get; }
}
