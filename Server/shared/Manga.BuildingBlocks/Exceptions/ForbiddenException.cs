namespace Manga.BuildingBlocks.Exceptions;

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message, string errorCode = "FORBIDDEN", object? details = null)
        : base(message, errorCode, StatusCodes.Status403Forbidden, details)
    {
    }
}
