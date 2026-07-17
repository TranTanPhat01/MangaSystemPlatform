using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Infrastructure.Persistence.Configurations;

public sealed class AdminAuditEventConfiguration : IEntityTypeConfiguration<AdminAuditEvent>
{
    public void Configure(EntityTypeBuilder<AdminAuditEvent> builder)
    {
        builder.ToTable("admin_audit_events");
        builder.HasKey(auditEvent => auditEvent.Id);
        builder.Property(auditEvent => auditEvent.Id).HasColumnName("id");
        builder.Property(auditEvent => auditEvent.ActorUserId).HasColumnName("actor_user_id").IsRequired();
        builder.Property(auditEvent => auditEvent.TargetUserId).HasColumnName("target_user_id").IsRequired();
        builder.Property(auditEvent => auditEvent.Action).HasColumnName("action").HasMaxLength(100).IsRequired();
        builder.Property(auditEvent => auditEvent.Details).HasColumnName("details").HasMaxLength(500);
        builder.Property(auditEvent => auditEvent.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasIndex(auditEvent => new { auditEvent.TargetUserId, auditEvent.CreatedAt });
        builder.HasIndex(auditEvent => new { auditEvent.ActorUserId, auditEvent.CreatedAt });
        builder.HasIndex(auditEvent => new { auditEvent.Action, auditEvent.CreatedAt });
    }
}
