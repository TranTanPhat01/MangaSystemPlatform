using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Manga.File.Application.Common;
using Manga.File.Application.DTOs;
using Manga.File.Application.Services;
using Manga.File.Api.Controllers.Requests;

namespace Manga.File.Api.Controllers;

[Authorize]
[ApiController]
[Route("files")]
public sealed class FilesController : ControllerBase
{
    private readonly IFileAssetService _fileAssetService;

    public FilesController(IFileAssetService fileAssetService)
    {
        _fileAssetService = fileAssetService;
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] FileUploadFormRequest request,
        CancellationToken cancellationToken)
    {
        await using var stream = request.File.OpenReadStream();
        var result = await _fileAssetService.UploadAsync(
            stream,
            request.File.FileName,
            request.File.ContentType,
            request.File.Length,
            request.FileCategory,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpGet("{fileId:guid}")]
    public async Task<IActionResult> GetById(Guid fileId, CancellationToken cancellationToken) =>
        ToActionResult(await _fileAssetService.GetByIdAsync(fileId, cancellationToken));

    [HttpGet("{fileId:guid}/download")]
    public async Task<IActionResult> Download(Guid fileId, CancellationToken cancellationToken)
    {
        var result = await _fileAssetService.DownloadAsync(fileId, cancellationToken);
        if (!result.IsSuccess || result.Value is null)
        {
            return ToActionResult(result);
        }

        return File(result.Value.Content, result.Value.ContentType, result.Value.FileName);
    }

    [HttpGet("{fileId:guid}/url")]
    public async Task<IActionResult> GetUrl(Guid fileId, CancellationToken cancellationToken) =>
        ToActionResult(await _fileAssetService.GetUrlAsync(fileId, cancellationToken));

    [HttpPost("{fileId:guid}/versions")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateVersion(
        Guid fileId,
        [FromForm] FileVersionUploadFormRequest request,
        CancellationToken cancellationToken)
    {
        await using var stream = request.File.OpenReadStream();
        var result = await _fileAssetService.CreateVersionAsync(
            fileId,
            stream,
            request.File.FileName,
            request.File.ContentType,
            request.File.Length,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpGet("{fileId:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid fileId, CancellationToken cancellationToken) =>
        ToActionResult(await _fileAssetService.GetVersionsAsync(fileId, cancellationToken));

    [HttpDelete("{fileId:guid}")]
    public async Task<IActionResult> Delete(Guid fileId, CancellationToken cancellationToken)
    {
        var result = await _fileAssetService.DeleteAsync(fileId, cancellationToken);
        return result.IsSuccess ? Ok(ApiResponse<object>.Ok("File deleted successfully")) : ToActionResult(result);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken) =>
        ToActionResult(await _fileAssetService.GetMineAsync(cancellationToken));

    private IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Ok(ApiResponse<T>.Ok(result.Value!));
        }

        throw CreateException(result.Error);
    }

    private static Exception CreateException(string? error)
    {
        var message = error ?? "Request failed.";
        if (message.Contains("not found", StringComparison.OrdinalIgnoreCase))
        {
            return new NotFoundException(message, ToErrorCode(message));
        }

        return new BadRequestException(message, ToErrorCode(message));
    }

    private static string ToErrorCode(string message)
    {
        if (message.Contains("extension", StringComparison.OrdinalIgnoreCase))
        {
            return "INVALID_FILE_EXTENSION";
        }

        if (message.Contains("size", StringComparison.OrdinalIgnoreCase))
        {
            return "FILE_TOO_LARGE";
        }

        var normalized = message.Replace(".", string.Empty, StringComparison.Ordinal);
        return string.Join(
            "_",
            normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .ToUpperInvariant();
    }
}
