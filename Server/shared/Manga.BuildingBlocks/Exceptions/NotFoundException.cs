namespace Manga.BuildingBlocks.Exceptions;

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message, string errorCode = "NOT_FOUND", object? details = null)
        : base(message, errorCode, StatusCodes.Status404NotFound, details)
    {
    }
}
