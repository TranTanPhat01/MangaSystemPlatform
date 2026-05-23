using Manga.Notification.Application.Abstractions;
using Manga.Notification.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Manga.Notification.Infrastructure.Persistence;

public sealed class NotificationDbContext : DbContext, INotificationUnitOfWork
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Domain.Entities.Notification> Notifications => Set<Domain.Entities.Notification>();

    public DbSet<InboxMessage> InboxMessages => Set<InboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(NotificationDbContext).Assembly);
    }
}
