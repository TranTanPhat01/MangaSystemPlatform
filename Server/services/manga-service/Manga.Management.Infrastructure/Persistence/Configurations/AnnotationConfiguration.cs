using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Infrastructure.Persistence.Configurations;

internal sealed class AnnotationConfiguration : IEntityTypeConfiguration<Annotation>
{
    public void Configure(EntityTypeBuilder<Annotation> builder)
    {
        builder.ToTable("annotations");
        builder.HasKey(annotation => annotation.Id);
        builder.Property(annotation => annotation.Id).HasColumnName("id");
        builder.Property(annotation => annotation.PageId).HasColumnName("page_id").IsRequired();
        builder.Property(annotation => annotation.Type).HasColumnName("type").HasConversion(type => type.ToString(), value => Enum.Parse<AnnotationType>(value)).HasMaxLength(64).IsRequired();
        builder.Property(annotation => annotation.CoordinatesJson).HasColumnName("coordinates_json").HasColumnType("jsonb").IsRequired();
        builder.Property(annotation => annotation.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(annotation => annotation.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.HasOne(annotation => annotation.Page).WithMany(page => page.Annotations).HasForeignKey(annotation => annotation.PageId).OnDelete(DeleteBehavior.Cascade);
    }
}
