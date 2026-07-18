using Manga.Management.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class ReaderFavoriteConfiguration : IEntityTypeConfiguration<ReaderFavorite>
{
    public void Configure(EntityTypeBuilder<ReaderFavorite> builder)
    {
        builder.ToTable("reader_favorites");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.SeriesId).HasColumnName("series_id").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasIndex(x => new { x.UserId, x.SeriesId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.CreatedAt });
        builder.HasOne<Series>().WithMany().HasForeignKey(x => x.SeriesId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ReaderBookmarkConfiguration : IEntityTypeConfiguration<ReaderBookmark>
{
    public void Configure(EntityTypeBuilder<ReaderBookmark> builder)
    {
        builder.ToTable("reader_bookmarks");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.ChapterId).HasColumnName("chapter_id").IsRequired();
        builder.Property(x => x.PageId).HasColumnName("page_id");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasIndex(x => new { x.UserId, x.ChapterId, x.PageId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.ChapterId }).IsUnique().HasFilter("\"page_id\" IS NULL");
        builder.HasIndex(x => new { x.UserId, x.CreatedAt });
        builder.HasOne<Chapter>().WithMany().HasForeignKey(x => x.ChapterId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Page>().WithMany().HasForeignKey(x => x.PageId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ReadingProgressConfiguration : IEntityTypeConfiguration<ReadingProgress>
{
    public void Configure(EntityTypeBuilder<ReadingProgress> builder)
    {
        builder.ToTable("reading_progresses");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.SeriesId).HasColumnName("series_id").IsRequired();
        builder.Property(x => x.ChapterId).HasColumnName("chapter_id").IsRequired();
        builder.Property(x => x.PageId).HasColumnName("page_id");
        builder.Property(x => x.LastReadAt).HasColumnName("last_read_at").IsRequired();
        builder.HasIndex(x => new { x.UserId, x.SeriesId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.LastReadAt });
        builder.HasOne<Series>().WithMany().HasForeignKey(x => x.SeriesId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Chapter>().WithMany().HasForeignKey(x => x.ChapterId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Page>().WithMany().HasForeignKey(x => x.PageId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class ReadingHistoryConfiguration : IEntityTypeConfiguration<ReadingHistory>
{
    public void Configure(EntityTypeBuilder<ReadingHistory> builder)
    {
        builder.ToTable("reading_histories");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.SeriesId).HasColumnName("series_id").IsRequired();
        builder.Property(x => x.ChapterId).HasColumnName("chapter_id").IsRequired();
        builder.Property(x => x.PageId).HasColumnName("page_id");
        builder.Property(x => x.LastReadAt).HasColumnName("last_read_at").IsRequired();
        builder.Property(x => x.VisitCount).HasColumnName("visit_count").IsRequired();
        builder.HasIndex(x => new { x.UserId, x.ChapterId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.LastReadAt });
        builder.HasOne<Series>().WithMany().HasForeignKey(x => x.SeriesId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Chapter>().WithMany().HasForeignKey(x => x.ChapterId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Page>().WithMany().HasForeignKey(x => x.PageId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class SeriesRatingConfiguration : IEntityTypeConfiguration<SeriesRating>
{
    public void Configure(EntityTypeBuilder<SeriesRating> builder)
    {
        builder.ToTable("series_ratings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.SeriesId).HasColumnName("series_id").IsRequired();
        builder.Property(x => x.Value).HasColumnName("value").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.HasIndex(x => new { x.UserId, x.SeriesId }).IsUnique();
        builder.HasOne<Series>().WithMany().HasForeignKey(x => x.SeriesId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ReaderCommentConfiguration : IEntityTypeConfiguration<ReaderComment>
{
    public void Configure(EntityTypeBuilder<ReaderComment> builder)
    {
        builder.ToTable("reader_comments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.SeriesId).HasColumnName("series_id");
        builder.Property(x => x.ChapterId).HasColumnName("chapter_id");
        builder.Property(x => x.Content).HasColumnName("content").HasMaxLength(2000).IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.HasIndex(x => new { x.SeriesId, x.CreatedAt });
        builder.HasIndex(x => new { x.ChapterId, x.CreatedAt });
        builder.HasOne<Series>().WithMany().HasForeignKey(x => x.SeriesId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Chapter>().WithMany().HasForeignKey(x => x.ChapterId).OnDelete(DeleteBehavior.Cascade);
        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
