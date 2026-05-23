namespace Manga.BuildingBlocks.Exceptions;

public abstract class AppException : Exception
{
    protected AppException(string message, string errorCode, int statusCode, object? details = null)
        : base(message)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
        Details = details;
    }

    public int StatusCode { get; }

    public string ErrorCode { get; }

    public object? Details { get; }
}
