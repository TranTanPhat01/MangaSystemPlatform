using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class StudioMemberConfiguration : IEntityTypeConfiguration<StudioMember>
{
    public void Configure(EntityTypeBuilder<StudioMember> builder)
    {
        builder.ToTable("studio_members");
        builder.HasKey(member => member.Id);
        builder.Property(member => member.Id).HasColumnName("id");
        builder.Property(member => member.StudioId).HasColumnName("studio_id").IsRequired();
        builder.Property(member => member.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(member => member.Role).HasColumnName("role").HasMaxLength(100).IsRequired();
        builder.Property(member => member.JoinedAt).HasColumnName("joined_at").IsRequired();
        builder.HasIndex(member => new { member.StudioId, member.UserId }).IsUnique();
        builder.HasOne(member => member.Studio).WithMany(studio => studio.Members).HasForeignKey(member => member.StudioId).OnDelete(DeleteBehavior.Cascade);
    }
}
