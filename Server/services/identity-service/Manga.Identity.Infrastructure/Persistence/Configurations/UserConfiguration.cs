using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Identity.Domain.Entities;
using Manga.Identity.Domain.Enums;

namespace Manga.Identity.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(user => user.Id);

        builder.Property(user => user.Id).HasColumnName("id");
        builder.Property(user => user.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
        builder.Property(user => user.Username).HasColumnName("username").HasMaxLength(100);
        builder.Property(user => user.NormalizedUsername).HasColumnName("normalized_username").HasMaxLength(100);
        builder.Property(user => user.FullName).HasColumnName("full_name").HasMaxLength(200).IsRequired();
        builder.Property(user => user.PasswordHash).HasColumnName("password_hash").HasMaxLength(512).IsRequired();
        builder.Property(user => user.Status)
            .HasColumnName("status")
            .HasConversion(status => status.ToString(), value => Enum.Parse<UserStatus>(value))
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(user => user.EmailVerified).HasColumnName("email_verified").IsRequired();
        builder.Property(user => user.LastLoginAt).HasColumnName("last_login_at");
        builder.Property(user => user.LockoutUntil).HasColumnName("lockout_until");
        builder.Property(user => user.LockReason).HasColumnName("lock_reason").HasMaxLength(500);
        builder.Property(user => user.LockedByUserId).HasColumnName("locked_by_user_id");
        builder.Property(user => user.DeletedAt).HasColumnName("deleted_at");
        builder.Property(user => user.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(user => user.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(user => user.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(user => user.Email).IsUnique();
        builder.HasIndex(user => user.Username).IsUnique();
        builder.HasIndex(user => user.NormalizedUsername).IsUnique();
        builder.HasIndex(user => user.DeletedAt);
    }
}
