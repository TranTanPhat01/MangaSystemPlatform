using System.ComponentModel.DataAnnotations;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Application.DTOs;

public sealed class CreatePageRequest
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; }
    public Guid? FileId { get; set; }
}

public sealed class UpdatePageStatusRequest
{
    [Required]
    public PageStatus Status { get; set; }
}

public sealed class PageResponse
{
    public Guid Id { get; set; }
    public Guid ChapterId { get; set; }
    public int PageNumber { get; set; }
    public Guid? FileId { get; set; }
    public PageStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
