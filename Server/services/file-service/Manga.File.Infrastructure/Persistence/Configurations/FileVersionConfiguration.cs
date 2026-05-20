using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.File.Domain.Entities;

namespace Manga.File.Infrastructure.Persistence.Configurations;

internal sealed class FileVersionConfiguration : IEntityTypeConfiguration<FileVersion>
{
    public void Configure(EntityTypeBuilder<FileVersion> builder)
    {
        builder.ToTable("file_versions");
        builder.HasKey(version => version.Id);
        builder.Property(version => version.Id).HasColumnName("id");
        builder.Property(version => version.FileAssetId).HasColumnName("file_asset_id").IsRequired();
        builder.Property(version => version.VersionNumber).HasColumnName("version_number").IsRequired();
        builder.Property(version => version.StoredFileName).HasColumnName("stored_file_name").HasMaxLength(500).IsRequired();
        builder.Property(version => version.StoragePath).HasColumnName("storage_path").HasMaxLength(1000).IsRequired();
        builder.Property(version => version.SizeInBytes).HasColumnName("size_in_bytes").IsRequired();
        builder.Property(version => version.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(version => version.CreatedByUserId).HasColumnName("created_by_user_id").IsRequired();
        builder.HasIndex(version => new { version.FileAssetId, version.VersionNumber }).IsUnique();
        builder.HasOne(version => version.FileAsset).WithMany(file => file.Versions).HasForeignKey(version => version.FileAssetId).OnDelete(DeleteBehavior.Cascade);
    }
}
