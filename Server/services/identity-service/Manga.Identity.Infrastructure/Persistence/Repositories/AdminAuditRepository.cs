using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Infrastructure.Persistence.Repositories;

internal sealed class AdminAuditRepository : IAdminAuditRepository
{
    private readonly IdentityDbContext _dbContext;

    public AdminAuditRepository(IdentityDbContext dbContext) => _dbContext = dbContext;

    public Task AddAsync(AdminAuditEvent auditEvent, CancellationToken cancellationToken = default) =>
        _dbContext.AdminAuditEvents.AddAsync(auditEvent, cancellationToken).AsTask();

    public async Task<PagedResponse<AdminAuditLogResponse>> SearchAsync(AdminAuditLogQuery query, CancellationToken cancellationToken = default)
    {
        IQueryable<AdminAuditEvent> events = _dbContext.AdminAuditEvents.AsNoTracking();
        if (query.ActorUserId.HasValue) events = events.Where(x => x.ActorUserId == query.ActorUserId.Value);
        if (query.TargetUserId.HasValue) events = events.Where(x => x.TargetUserId == query.TargetUserId.Value);
        if (!string.IsNullOrWhiteSpace(query.Action)) events = events.Where(x => x.Action == query.Action.Trim());
        if (query.From.HasValue) events = events.Where(x => x.CreatedAt >= query.From.Value);
        if (query.To.HasValue) events = events.Where(x => x.CreatedAt <= query.To.Value);
        var totalItems = await events.CountAsync(cancellationToken);
        var items = await events.OrderByDescending(x => x.CreatedAt).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(x => new AdminAuditLogResponse { Id = x.Id, ActorUserId = x.ActorUserId, TargetUserId = x.TargetUserId, Action = x.Action, Details = x.Details, CreatedAt = x.CreatedAt })
            .ToArrayAsync(cancellationToken);
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)query.PageSize);
        return new PagedResponse<AdminAuditLogResponse> { Items = items, Page = query.Page, PageSize = query.PageSize, TotalItems = totalItems, TotalPages = totalPages, HasNextPage = query.Page < totalPages, HasPreviousPage = query.Page > 1 };
    }
}
