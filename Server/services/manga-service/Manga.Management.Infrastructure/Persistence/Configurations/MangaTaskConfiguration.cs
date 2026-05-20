using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using DomainTaskStatus = Manga.Management.Domain.Enums.TaskStatus;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class MangaTaskConfiguration : IEntityTypeConfiguration<MangaTask>
{
    public void Configure(EntityTypeBuilder<MangaTask> builder)
    {
        builder.ToTable("manga_tasks");
        builder.HasKey(task => task.Id);
        builder.Property(task => task.Id).HasColumnName("id");
        builder.Property(task => task.AnnotationId).HasColumnName("annotation_id").IsRequired();
        builder.Property(task => task.PageId).HasColumnName("page_id").IsRequired();
        builder.Property(task => task.Title).HasColumnName("title").HasMaxLength(300).IsRequired();
        builder.Property(task => task.Description).HasColumnName("description").HasMaxLength(2000);
        builder.Property(task => task.AssignedToUserId).HasColumnName("assigned_to_user_id").IsRequired();
        builder.Property(task => task.CreatedByUserId).HasColumnName("created_by_user_id").IsRequired();
        builder.Property(task => task.Status).HasColumnName("status").HasConversion(status => status.ToString(), value => Enum.Parse<DomainTaskStatus>(value)).HasMaxLength(64).IsRequired();
        builder.Property(task => task.Priority).HasColumnName("priority").HasConversion(priority => priority.ToString(), value => Enum.Parse<TaskPriority>(value)).HasMaxLength(64).IsRequired();
        builder.Property(task => task.Deadline).HasColumnName("deadline");
        builder.Property(task => task.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(task => task.UpdatedAt).HasColumnName("updated_at");
        builder.HasOne(task => task.Annotation).WithMany(annotation => annotation.Tasks).HasForeignKey(task => task.AnnotationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(task => task.Page).WithMany(page => page.Tasks).HasForeignKey(task => task.PageId).OnDelete(DeleteBehavior.Cascade);
    }
}
