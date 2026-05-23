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
        builder.Property(user => user.FullName).HasColumnName("full_name").HasMaxLength(200).IsRequired();
        builder.Property(user => user.PasswordHash).HasColumnName("password_hash").HasMaxLength(512).IsRequired();
        builder.Property(user => user.Status)
            .HasColumnName("status")
            .HasConversion(status => status.ToString(), value => Enum.Parse<UserStatus>(value))
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(user => user.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(user => user.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(user => user.Email).IsUnique();
    }
}
