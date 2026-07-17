using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;

namespace Manga.Identity.Application.Services;

public interface IAdminAuditService
{
    Task<Result<PagedResponse<AdminAuditLogResponse>>> GetAsync(AdminAuditLogQuery query, CancellationToken cancellationToken = default);
}
