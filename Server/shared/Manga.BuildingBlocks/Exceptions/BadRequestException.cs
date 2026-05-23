namespace Manga.BuildingBlocks.Exceptions;

public sealed class BadRequestException : AppException
{
    public BadRequestException(string message, string errorCode = "BAD_REQUEST", object? details = null)
        : base(message, errorCode, StatusCodes.Status400BadRequest, details)
    {
    }
}
