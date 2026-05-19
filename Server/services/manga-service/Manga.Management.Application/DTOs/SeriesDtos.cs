using System.ComponentModel.DataAnnotations;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Application.DTOs;

public sealed class CreateSeriesRequest
{
    [Required]
    public Guid StudioId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Genre { get; set; }
}

public sealed class UpdateSeriesRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public SeriesStatus? Status { get; set; }
}

public sealed class SeriesResponse
{
    public Guid Id { get; set; }
    public Guid StudioId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public SeriesStatus Status { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
