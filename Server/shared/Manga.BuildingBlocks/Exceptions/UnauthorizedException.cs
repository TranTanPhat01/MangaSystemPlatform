namespace Manga.BuildingBlocks.Exceptions;

public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message, string errorCode = "UNAUTHORIZED", object? details = null)
        : base(message, errorCode, StatusCodes.Status401Unauthorized, details)
    {
    }
}
