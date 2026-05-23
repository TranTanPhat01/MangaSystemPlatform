using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.File.Domain.Entities;
using Manga.File.Domain.Enums;

namespace Manga.File.Infrastructure.Persistence.Configurations;

internal sealed class FileAssetConfiguration : IEntityTypeConfiguration<FileAsset>
{
    public void Configure(EntityTypeBuilder<FileAsset> builder)
    {
        builder.ToTable("file_assets");
        builder.HasKey(file => file.Id);
        builder.Property(file => file.Id).HasColumnName("id");
        builder.Property(file => file.OriginalFileName).HasColumnName("original_file_name").HasMaxLength(500).IsRequired();
        builder.Property(file => file.StoredFileName).HasColumnName("stored_file_name").HasMaxLength(500).IsRequired();
        builder.Property(file => file.ContentType).HasColumnName("content_type").HasMaxLength(200).IsRequired();
        builder.Property(file => file.Extension).HasColumnName("extension").HasMaxLength(20).IsRequired();
        builder.Property(file => file.SizeInBytes).HasColumnName("size_in_bytes").IsRequired();
        builder.Property(file => file.StorageProvider).HasColumnName("storage_provider").HasConversion(value => value.ToString(), value => Enum.Parse<StorageProvider>(value)).HasMaxLength(64).IsRequired();
        builder.Property(file => file.StoragePath).HasColumnName("storage_path").HasMaxLength(1000).IsRequired();
        builder.Property(file => file.PublicUrl).HasColumnName("public_url").HasMaxLength(1000);
        builder.Property(file => file.UploadedByUserId).HasColumnName("uploaded_by_user_id").IsRequired();
        builder.Property(file => file.FileCategory).HasColumnName("file_category").HasConversion(value => value.ToString(), value => Enum.Parse<FileCategory>(value)).HasMaxLength(64).IsRequired();
        builder.Property(file => file.Status).HasColumnName("status").HasConversion(value => value.ToString(), value => Enum.Parse<FileStatus>(value)).HasMaxLength(64).IsRequired();
        builder.Property(file => file.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(file => file.UpdatedAt).HasColumnName("updated_at");
    }
}
