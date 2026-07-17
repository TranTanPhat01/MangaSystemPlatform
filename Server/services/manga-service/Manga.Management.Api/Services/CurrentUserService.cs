using System.Security.Claims;
using Manga.Management.Application.Services;

namespace Manga.Management.Api.Services;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserService(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid UserId => Guid.TryParse(_accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;

    public bool IsInRole(string role) => _accessor.HttpContext?.User.IsInRole(role) == true;
}
