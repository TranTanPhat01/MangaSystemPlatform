using Manga.Identity.Domain.Entities;
using Manga.Identity.Application.DTOs;

namespace Manga.Identity.Application.Abstractions;

public interface IAdminAuditRepository
{
    Task AddAsync(AdminAuditEvent auditEvent, CancellationToken cancellationToken = default);
    Task<PagedResponse<AdminAuditLogResponse>> SearchAsync(AdminAuditLogQuery query, CancellationToken cancellationToken = default);
}
