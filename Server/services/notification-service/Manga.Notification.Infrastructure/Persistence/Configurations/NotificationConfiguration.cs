using Manga.Notification.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Manga.Notification.Infrastructure.Persistence.Configurations;

internal sealed class NotificationConfiguration : IEntityTypeConfiguration<Domain.Entities.Notification>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(notification => notification.Id);
        builder.HasIndex(notification => notification.UserId);
        builder.HasIndex(notification => new { notification.SourceEventId, notification.Type, notification.UserId }).IsUnique();
        builder.Property(notification => notification.Title).HasMaxLength(200).IsRequired();
        builder.Property(notification => notification.Message).HasMaxLength(1000).IsRequired();
        builder.Property(notification => notification.Type).HasConversion<string>().HasMaxLength(80).IsRequired();
        builder.Property(notification => notification.Status).HasConversion<string>().HasMaxLength(40).IsRequired();
        builder.Property(notification => notification.SourceEventType).HasMaxLength(200);
    }
}
