using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Infrastructure.Persistence.Configurations;

public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");

        builder.HasKey(role => role.Id);

        builder.Property(role => role.Id).HasColumnName("id");
        builder.Property(role => role.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(role => role.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(role => role.IsSystem).HasColumnName("is_system").IsRequired();
        builder.Property(role => role.IsRetired).HasColumnName("is_retired").IsRequired();
        builder.Property(role => role.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(role => role.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(role => role.Name).IsUnique();

        builder.HasData(
            new Role { Id = IdentityRoleIds.Admin, Name = "Admin", Description = "System administrator", IsSystem = true, CreatedAt = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Role { Id = IdentityRoleIds.Mangaka, Name = "Mangaka", Description = "Manga creator", IsSystem = true, CreatedAt = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Role { Id = IdentityRoleIds.Assistant, Name = "Assistant", Description = "Mangaka assistant", IsSystem = true, CreatedAt = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Role { Id = IdentityRoleIds.TantouEditor, Name = "TantouEditor", Description = "Assigned editor", IsSystem = true, CreatedAt = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Role { Id = IdentityRoleIds.EditorialBoard, Name = "EditorialBoard", Description = "Editorial board member", IsSystem = true, CreatedAt = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc) });
    }
}
