using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.ToTable("submissions");
        builder.HasKey(submission => submission.Id);
        builder.Property(submission => submission.Id).HasColumnName("id");
        builder.Property(submission => submission.TaskId).HasColumnName("task_id").IsRequired();
        builder.Property(submission => submission.SubmittedByUserId).HasColumnName("submitted_by_user_id").IsRequired();
        builder.Property(submission => submission.FileId).HasColumnName("file_id");
        builder.Property(submission => submission.Note).HasColumnName("note").HasMaxLength(2000);
        builder.Property(submission => submission.Status).HasColumnName("status").HasConversion(status => status.ToString(), value => Enum.Parse<SubmissionStatus>(value)).HasMaxLength(64).IsRequired();
        builder.Property(submission => submission.SubmittedAt).HasColumnName("submitted_at").IsRequired();
        builder.HasOne(submission => submission.Task).WithMany(task => task.Submissions).HasForeignKey(submission => submission.TaskId).OnDelete(DeleteBehavior.Cascade);
    }
}
