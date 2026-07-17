using Manga.BuildingBlocks.Authorization;
using Manga.BuildingBlocks.Responses;
using Manga.Identity.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Manga.Identity.Api.Controllers;

[ApiController]
[Route("identity/admin/permissions")]
public sealed class AdminPermissionsController : ControllerBase
{
    private readonly IPermissionRepository _permissions;

    public AdminPermissionsController(IPermissionRepository permissions) => _permissions = permissions;

    [Authorize(Policy = PermissionPolicies.RequireAdminRoleRead)]
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        Ok(ApiResponse<object>.Ok(await _permissions.ListAsync(cancellationToken)));
}
