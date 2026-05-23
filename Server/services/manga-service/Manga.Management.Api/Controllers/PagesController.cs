using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;

namespace Manga.Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("manga/pages")]
public sealed class PagesController : ApiControllerBase
{
    private readonly IPageService _pageService;
    private readonly IAnnotationService _annotationService;

    public PagesController(IPageService pageService, IAnnotationService annotationService)
    {
        _pageService = pageService;
        _annotationService = annotationService;
    }

    [HttpGet("{pageId:guid}")]
    public async Task<IActionResult> GetById(Guid pageId, CancellationToken cancellationToken) =>
        ToActionResult(await _pageService.GetByIdAsync(pageId, cancellationToken));

    [HttpPatch("{pageId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid pageId, UpdatePageStatusRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _pageService.UpdateStatusAsync(pageId, request, cancellationToken));

    [HttpPost("{pageId:guid}/annotations")]
    public async Task<IActionResult> CreateAnnotation(Guid pageId, CreateAnnotationRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await _annotationService.CreateAsync(pageId, request, CurrentUserId, cancellationToken));

    [HttpGet("{pageId:guid}/annotations")]
    public async Task<IActionResult> GetAnnotations(Guid pageId, CancellationToken cancellationToken) =>
        ToActionResult(await _annotationService.GetByPageAsync(pageId, cancellationToken));
}
