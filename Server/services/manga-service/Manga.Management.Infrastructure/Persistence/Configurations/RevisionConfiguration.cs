using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class RevisionConfiguration : IEntityTypeConfiguration<Revision>
{
    public void Configure(EntityTypeBuilder<Revision> builder)
    {
        builder.ToTable("revisions");
        builder.HasKey(revision => revision.Id);
        builder.Property(revision => revision.Id).HasColumnName("id");
        builder.Property(revision => revision.TaskId).HasColumnName("task_id").IsRequired();
        builder.Property(revision => revision.RequestedByUserId).HasColumnName("requested_by_user_id").IsRequired();
        builder.Property(revision => revision.Reason).HasColumnName("reason").HasMaxLength(2000).IsRequired();
        builder.Property(revision => revision.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasOne(revision => revision.Task).WithMany(task => task.Revisions).HasForeignKey(revision => revision.TaskId).OnDelete(DeleteBehavior.Cascade);
    }
}
