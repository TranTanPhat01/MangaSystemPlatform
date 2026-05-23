using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class StudioConfiguration : IEntityTypeConfiguration<Studio>
{
    public void Configure(EntityTypeBuilder<Studio> builder)
    {
        builder.ToTable("studios");
        builder.HasKey(studio => studio.Id);
        builder.Property(studio => studio.Id).HasColumnName("id");
        builder.Property(studio => studio.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(studio => studio.Description).HasColumnName("description").HasMaxLength(1000);
        builder.Property(studio => studio.OwnerId).HasColumnName("owner_id").IsRequired();
        builder.Property(studio => studio.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(studio => studio.UpdatedAt).HasColumnName("updated_at");
    }
}
