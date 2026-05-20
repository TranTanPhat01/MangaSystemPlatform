using Microsoft.AspNetCore.Mvc;
using Manga.Editorial.Application.Common;

namespace Manga.Editorial.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess) return Ok(result.Value);
        return result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true
            ? NotFound(new { message = result.Error })
            : BadRequest(new { message = result.Error });
    }
}
