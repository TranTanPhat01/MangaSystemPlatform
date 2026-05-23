namespace Manga.BuildingBlocks.Exceptions;

public sealed class ConflictException : AppException
{
    public ConflictException(string message, string errorCode = "CONFLICT", object? details = null)
        : base(message, errorCode, StatusCodes.Status409Conflict, details)
    {
    }
}
