using System.ComponentModel.DataAnnotations;

namespace Manga.File.Api.Controllers.Requests;

public sealed class FileVersionUploadFormRequest
{
    [Required]
    public IFormFile File { get; set; } = default!;
}
