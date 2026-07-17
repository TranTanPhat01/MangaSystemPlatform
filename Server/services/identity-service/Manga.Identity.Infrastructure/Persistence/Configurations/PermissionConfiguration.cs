using Manga.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Manga.Identity.Infrastructure.Persistence.Configurations;

public sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("permissions");
        builder.HasKey(permission => permission.Id);
        builder.Property(permission => permission.Id).HasColumnName("id");
        builder.Property(permission => permission.Key).HasColumnName("key").HasMaxLength(128).IsRequired();
        builder.Property(permission => permission.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(permission => permission.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(permission => permission.Group).HasColumnName("group_name").HasMaxLength(100).IsRequired();
        builder.Property(permission => permission.IsSystem).HasColumnName("is_system").IsRequired();
        builder.Property(permission => permission.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasIndex(permission => permission.Key).IsUnique();
        builder.HasData(IdentityPermissionCatalog.BuildPermissions());
    }
}
