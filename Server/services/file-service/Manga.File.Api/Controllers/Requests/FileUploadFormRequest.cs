using System.ComponentModel.DataAnnotations;
using Manga.File.Domain.Enums;

namespace Manga.File.Api.Controllers.Requests;

public sealed class FileUploadFormRequest
{
    [Required]
    public IFormFile File { get; set; } = default!;

    [Required]
    public FileCategory FileCategory { get; set; }
}
