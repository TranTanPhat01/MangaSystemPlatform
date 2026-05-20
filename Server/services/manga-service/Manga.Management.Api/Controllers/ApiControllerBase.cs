using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Manga.Management.Application.Common;

namespace Manga.Management.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected Guid CurrentUserId
    {
        get
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var parsedUserId) ? parsedUserId : Guid.Empty;
        }
    }

    protected IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return result.Error?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true
            ? NotFound(new { message = result.Error })
            : BadRequest(new { message = result.Error });
    }
}
