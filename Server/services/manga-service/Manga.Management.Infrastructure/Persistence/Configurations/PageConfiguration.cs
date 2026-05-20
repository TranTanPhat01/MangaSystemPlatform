using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class PageConfiguration : IEntityTypeConfiguration<Page>
{
    public void Configure(EntityTypeBuilder<Page> builder)
    {
        builder.ToTable("pages");
        builder.HasKey(page => page.Id);
        builder.Property(page => page.Id).HasColumnName("id");
        builder.Property(page => page.ChapterId).HasColumnName("chapter_id").IsRequired();
        builder.Property(page => page.PageNumber).HasColumnName("page_number").IsRequired();
        builder.Property(page => page.FileId).HasColumnName("file_id");
        builder.Property(page => page.Status).HasColumnName("status").HasConversion(status => status.ToString(), value => Enum.Parse<PageStatus>(value)).HasMaxLength(64).IsRequired();
        builder.Property(page => page.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(page => page.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(page => new { page.ChapterId, page.PageNumber }).IsUnique();
        builder.HasOne(page => page.Chapter).WithMany(chapter => chapter.Pages).HasForeignKey(page => page.ChapterId).OnDelete(DeleteBehavior.Cascade);
    }
}
