namespace Manga.BuildingBlocks.Exceptions;

public sealed class ValidationException : AppException
{
    public ValidationException(string message, IEnumerable<ValidationError> errors, string errorCode = "VALIDATION_ERROR")
        : base(message, errorCode, StatusCodes.Status422UnprocessableEntity, errors.ToArray())
    {
    }

    public ValidationException(string message, string errorCode = "VALIDATION_ERROR", object? details = null)
        : base(message, errorCode, StatusCodes.Status422UnprocessableEntity, details)
    {
    }
}
