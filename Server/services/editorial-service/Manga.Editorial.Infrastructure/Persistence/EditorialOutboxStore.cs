using Manga.BuildingBlocks.Messaging;
using Microsoft.EntityFrameworkCore;

namespace Manga.Editorial.Infrastructure.Persistence;
internal sealed class EditorialOutboxStore(EditorialDbContext db) : IOutboxStore, IOutboxOperations
{
    public Task AddAsync(OutboxMessage message, CancellationToken cancellationToken = default) => db.OutboxMessages.AddAsync(message, cancellationToken).AsTask();
    public async Task<IReadOnlyList<OutboxMessage>> GetDueAsync(int take, DateTime now, CancellationToken cancellationToken = default) => await db.OutboxMessages.Where(x => x.Status == OutboxMessageStatus.Pending && (!x.NextRetryAt.HasValue || x.NextRetryAt <= now)).OrderBy(x => x.CreatedAt).Take(take).ToListAsync(cancellationToken);
    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
    public async Task<IReadOnlyList<OutboxMessage>> ListAsync(OutboxMessageStatus? status, int page, int pageSize, CancellationToken cancellationToken = default) => await db.OutboxMessages.Where(x => !status.HasValue || x.Status == status).OrderByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
    public Task<OutboxMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => db.OutboxMessages.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    public async Task<bool> RetryAsync(Guid id, CancellationToken cancellationToken = default) { var message = await GetByIdAsync(id, cancellationToken); if (message is null || message.Status != OutboxMessageStatus.Failed) return false; Reset(message); await SaveChangesAsync(cancellationToken); return true; }
    public async Task<int> RetryFailedAsync(CancellationToken cancellationToken = default) { var messages = await db.OutboxMessages.Where(x => x.Status == OutboxMessageStatus.Failed).ToListAsync(cancellationToken); foreach (var message in messages) Reset(message); await SaveChangesAsync(cancellationToken); return messages.Count; }
    public async Task<OutboxSummary> GetSummaryAsync(CancellationToken cancellationToken = default) { var now = DateTime.UtcNow; return new OutboxSummary(await db.OutboxMessages.CountAsync(x => x.Status == OutboxMessageStatus.Pending, cancellationToken), await db.OutboxMessages.CountAsync(x => x.Status == OutboxMessageStatus.Failed, cancellationToken), await db.OutboxMessages.CountAsync(x => x.Status == OutboxMessageStatus.Published && x.ProcessedAt >= now.AddHours(-24), cancellationToken), await db.OutboxMessages.Where(x => x.Status == OutboxMessageStatus.Failed).MaxAsync(x => (DateTime?)x.CreatedAt, cancellationToken)); }
    private static void Reset(OutboxMessage message) { message.Status = OutboxMessageStatus.Pending; message.LastError = null; message.NextRetryAt = DateTime.UtcNow; }
}
