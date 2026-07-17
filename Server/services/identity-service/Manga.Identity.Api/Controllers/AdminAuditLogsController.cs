using Manga.BuildingBlocks.Authorization;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Manga.Identity.Api.Controllers;

[ApiController]
[Route("identity/admin/audit-logs")]
public sealed class AdminAuditLogsController : ControllerBase
{
    private readonly IAdminAuditService _audit;

    public AdminAuditLogsController(IAdminAuditService audit) => _audit = audit;

    [Authorize(Policy = PermissionPolicies.RequireAdminAuditRead)]
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] AdminAuditLogQuery query, CancellationToken cancellationToken)
    {
        var result = await _audit.GetAsync(query, cancellationToken);
        if (!result.IsSuccess) throw new BadRequestException(result.Error ?? "Invalid audit log query.", "INVALID_AUDIT_QUERY");
        return Ok(ApiResponse<PagedResponse<AdminAuditLogResponse>>.Ok(result.Value!));
    }
}
