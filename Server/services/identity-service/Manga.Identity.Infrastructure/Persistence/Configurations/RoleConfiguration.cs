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

        builder.HasIndex(role => role.Name).IsUnique();

        builder.HasData(
            new Role { Id = IdentityRoleIds.Admin, Name = "Admin", Description = "System administrator" },
            new Role { Id = IdentityRoleIds.Mangaka, Name = "Mangaka", Description = "Manga creator" },
            new Role { Id = IdentityRoleIds.Assistant, Name = "Assistant", Description = "Mangaka assistant" },
            new Role { Id = IdentityRoleIds.TantouEditor, Name = "TantouEditor", Description = "Assigned editor" },
            new Role { Id = IdentityRoleIds.EditorialBoard, Name = "EditorialBoard", Description = "Editorial board member" });
    }
}
