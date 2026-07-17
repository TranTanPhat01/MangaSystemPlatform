using Manga.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Manga.Identity.Infrastructure.Persistence.Configurations;

public sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("role_permissions");
        builder.HasKey(rolePermission => new { rolePermission.RoleId, rolePermission.PermissionId });
        builder.Property(rolePermission => rolePermission.RoleId).HasColumnName("role_id");
        builder.Property(rolePermission => rolePermission.PermissionId).HasColumnName("permission_id");
        builder.Property(rolePermission => rolePermission.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasOne(rolePermission => rolePermission.Role).WithMany(role => role.RolePermissions).HasForeignKey(rolePermission => rolePermission.RoleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(rolePermission => rolePermission.Permission).WithMany(permission => permission.RolePermissions).HasForeignKey(rolePermission => rolePermission.PermissionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasData(IdentityPermissionCatalog.RolePermissions);
    }
}
