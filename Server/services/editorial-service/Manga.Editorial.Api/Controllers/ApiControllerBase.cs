using Microsoft.AspNetCore.Mvc;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Manga.Editorial.Application.Common;

namespace Manga.Editorial.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess) return Ok(ApiResponse<T>.Ok(result.Value!));
        throw CreateException(result.Error);
    }

    private static Exception CreateException(string? error)
    {
        var message = error ?? "Request failed.";
        if (message.Contains("not found", StringComparison.OrdinalIgnoreCase))
        {
            return new NotFoundException(message, ToErrorCode(message));
        }

        if (message.Contains("already", StringComparison.OrdinalIgnoreCase))
        {
            return new ConflictException(message, ToErrorCode(message));
        }

        return new BadRequestException(message, ToErrorCode(message));
    }

    private static string ToErrorCode(string message)
    {
        var normalized = message.Replace(".", string.Empty, StringComparison.Ordinal);
        return string.Join(
            "_",
            normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .ToUpperInvariant();
    }
}
