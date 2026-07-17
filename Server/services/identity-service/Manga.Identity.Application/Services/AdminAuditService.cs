using FluentValidation;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Validation;

namespace Manga.Identity.Application.Services;

public sealed class AdminAuditService : IAdminAuditService
{
    private readonly IAdminAuditRepository _auditEvents;

    public AdminAuditService(IAdminAuditRepository auditEvents) => _auditEvents = auditEvents;

    public async Task<Result<PagedResponse<AdminAuditLogResponse>>> GetAsync(AdminAuditLogQuery query, CancellationToken cancellationToken = default)
    {
        var validation = new AdminAuditLogQueryValidator().Validate(query);
        if (!validation.IsValid) return Result<PagedResponse<AdminAuditLogResponse>>.Failure(string.Join(" ", validation.Errors.Select(error => error.ErrorMessage)));
        return Result<PagedResponse<AdminAuditLogResponse>>.Success(await _auditEvents.SearchAsync(query, cancellationToken));
    }
}
