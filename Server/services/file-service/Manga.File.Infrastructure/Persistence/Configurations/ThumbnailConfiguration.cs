using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.File.Domain.Entities;

namespace Manga.File.Infrastructure.Persistence.Configurations;

internal sealed class ThumbnailConfiguration : IEntityTypeConfiguration<Thumbnail>
{
    public void Configure(EntityTypeBuilder<Thumbnail> builder)
    {
        builder.ToTable("thumbnails");
        builder.HasKey(thumbnail => thumbnail.Id);
        builder.Property(thumbnail => thumbnail.Id).HasColumnName("id");
        builder.Property(thumbnail => thumbnail.FileAssetId).HasColumnName("file_asset_id").IsRequired();
        builder.Property(thumbnail => thumbnail.Width).HasColumnName("width").IsRequired();
        builder.Property(thumbnail => thumbnail.Height).HasColumnName("height").IsRequired();
        builder.Property(thumbnail => thumbnail.StoragePath).HasColumnName("storage_path").HasMaxLength(1000).IsRequired();
        builder.Property(thumbnail => thumbnail.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasOne(thumbnail => thumbnail.FileAsset).WithMany(file => file.Thumbnails).HasForeignKey(thumbnail => thumbnail.FileAssetId).OnDelete(DeleteBehavior.Cascade);
    }
}
