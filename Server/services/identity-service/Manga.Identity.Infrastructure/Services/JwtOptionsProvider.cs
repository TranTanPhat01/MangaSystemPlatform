using Microsoft.Extensions.Options;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.Options;

namespace Manga.Identity.Infrastructure.Services;

public sealed class JwtOptionsProvider : IJwtOptionsProvider
{
    private readonly JwtOptions _options;

    public JwtOptionsProvider(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public int AccessTokenExpirationMinutes => _options.AccessTokenExpirationMinutes;
    public int RefreshTokenExpirationDays => _options.RefreshTokenExpirationDays;
}
