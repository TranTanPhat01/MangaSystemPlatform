using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.HasKey(refreshToken => refreshToken.Id);

        builder.Property(refreshToken => refreshToken.Id).HasColumnName("id");
        builder.Property(refreshToken => refreshToken.UserId).HasColumnName("user_id");
        builder.Property(refreshToken => refreshToken.Token).HasColumnName("token").HasMaxLength(256).IsRequired();
        builder.Property(refreshToken => refreshToken.ExpiresAt).HasColumnName("expires_at").IsRequired();
        builder.Property(refreshToken => refreshToken.RevokedAt).HasColumnName("revoked_at");
        builder.Property(refreshToken => refreshToken.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasIndex(refreshToken => refreshToken.Token).IsUnique();

        builder.HasOne(refreshToken => refreshToken.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(refreshToken => refreshToken.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
