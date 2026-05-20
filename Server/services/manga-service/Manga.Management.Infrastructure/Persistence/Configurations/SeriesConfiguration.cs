using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class SeriesConfiguration : IEntityTypeConfiguration<Series>
{
    public void Configure(EntityTypeBuilder<Series> builder)
    {
        builder.ToTable("series");
        builder.HasKey(series => series.Id);
        builder.Property(series => series.Id).HasColumnName("id");
        builder.Property(series => series.StudioId).HasColumnName("studio_id").IsRequired();
        builder.Property(series => series.Title).HasColumnName("title").HasMaxLength(300).IsRequired();
        builder.Property(series => series.Description).HasColumnName("description").HasMaxLength(2000);
        builder.Property(series => series.Genre).HasColumnName("genre").HasMaxLength(200);
        builder.Property(series => series.Status).HasColumnName("status").HasConversion(status => status.ToString(), value => Enum.Parse<SeriesStatus>(value)).HasMaxLength(64).IsRequired();
        builder.Property(series => series.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(series => series.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(series => series.UpdatedAt).HasColumnName("updated_at");
        builder.HasOne(series => series.Studio).WithMany(studio => studio.Series).HasForeignKey(series => series.StudioId).OnDelete(DeleteBehavior.Cascade);
    }
}
