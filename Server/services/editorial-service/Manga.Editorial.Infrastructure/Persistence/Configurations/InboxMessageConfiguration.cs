using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Editorial.Domain.Entities;

namespace Manga.Editorial.Infrastructure.Persistence.Configurations;

internal sealed class InboxMessageConfiguration : IEntityTypeConfiguration<InboxMessage>
{
    public void Configure(EntityTypeBuilder<InboxMessage> builder)
    {
        builder.ToTable("inbox_messages");
        builder.HasKey(message => message.Id);
        builder.HasIndex(message => message.MessageId).IsUnique();
        builder.Property(message => message.EventType).HasMaxLength(200).IsRequired();
        builder.Property(message => message.Payload).IsRequired();
        builder.Property(message => message.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(message => message.Error).HasMaxLength(2000);
    }
}
