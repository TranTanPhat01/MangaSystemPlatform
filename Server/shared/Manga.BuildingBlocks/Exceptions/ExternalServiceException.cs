namespace Manga.BuildingBlocks.Exceptions;

public sealed class ExternalServiceException : AppException
{
    public ExternalServiceException(string message, string errorCode = "EXTERNAL_SERVICE_ERROR", object? details = null)
        : base(message, errorCode, StatusCodes.Status502BadGateway, details)
    {
    }
}
