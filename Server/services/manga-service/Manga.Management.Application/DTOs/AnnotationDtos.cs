using System.ComponentModel.DataAnnotations;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Application.DTOs;

public sealed class CreateAnnotationRequest
{
    [Required]
    public AnnotationType Type { get; set; }

    [Required]
    public string CoordinatesJson { get; set; } = string.Empty;
}

public sealed class AnnotationResponse
{
    public Guid Id { get; set; }
    public Guid PageId { get; set; }
    public AnnotationType Type { get; set; }
    public string CoordinatesJson { get; set; } = string.Empty;
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
