using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class ChapterConfiguration : IEntityTypeConfiguration<Chapter>
{
    public void Configure(EntityTypeBuilder<Chapter> builder)
    {
        builder.ToTable("chapters");
        builder.HasKey(chapter => chapter.Id);
        builder.Property(chapter => chapter.Id).HasColumnName("id");
        builder.Property(chapter => chapter.SeriesId).HasColumnName("series_id").IsRequired();
        builder.Property(chapter => chapter.ChapterNumber).HasColumnName("chapter_number").IsRequired();
        builder.Property(chapter => chapter.Title).HasColumnName("title").HasMaxLength(300).IsRequired();
        builder.Property(chapter => chapter.Status).HasColumnName("status").HasConversion(status => status.ToString(), value => Enum.Parse<ChapterStatus>(value)).HasMaxLength(64).IsRequired();
        builder.Property(chapter => chapter.Deadline).HasColumnName("deadline");
        builder.Property(chapter => chapter.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(chapter => chapter.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(chapter => new { chapter.SeriesId, chapter.ChapterNumber }).IsUnique();
        builder.HasOne(chapter => chapter.Series).WithMany(series => series.Chapters).HasForeignKey(chapter => chapter.SeriesId).OnDelete(DeleteBehavior.Cascade);
    }
}
