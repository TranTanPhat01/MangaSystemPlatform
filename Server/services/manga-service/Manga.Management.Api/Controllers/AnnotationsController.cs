using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Management.Application.Services;

namespace Manga.Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("manga/annotations")]
public sealed class AnnotationsController : ApiControllerBase
{
    private readonly IAnnotationService _annotationService;

    public AnnotationsController(IAnnotationService annotationService)
    {
        _annotationService = annotationService;
    }

    [HttpDelete("{annotationId:guid}")]
    public async Task<IActionResult> Delete(Guid annotationId, CancellationToken cancellationToken)
    {
        var result = await _annotationService.DeleteAsync(annotationId, cancellationToken);
        return result.IsSuccess ? ToSuccessResult("Annotation deleted successfully") : ToActionResult(result);
    }
}
