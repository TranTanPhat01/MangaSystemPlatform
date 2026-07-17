using Manga.BuildingBlocks.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox_messages");
        builder.HasKey(message => message.Id);
        builder.HasIndex(message => message.MessageId).IsUnique();
        builder.HasIndex(message => new { message.Status, message.NextRetryAt });
        builder.Property(message => message.EventType).HasMaxLength(1000).IsRequired();
        builder.Property(message => message.RoutingKey).HasMaxLength(256).IsRequired();
        builder.Property(message => message.Payload).HasColumnType("text").IsRequired();
        builder.Property(message => message.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(message => message.LastError).HasColumnType("text");
    }
}
