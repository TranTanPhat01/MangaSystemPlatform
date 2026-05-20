namespace Manga.BuildingBlocks.Responses;

public sealed class ApiResponse<T>
{
    private ApiResponse(bool success, string message, T? data, ApiError? error)
    {
        Success = success;
        Message = message;
        Data = data;
        Error = error;
        Timestamp = DateTime.UtcNow;
    }

    public bool Success { get; }

    public string Message { get; }

    public T? Data { get; }

    public ApiError? Error { get; }

    public DateTime Timestamp { get; }

    public static ApiResponse<T> Ok(T data, string message = "Request completed successfully") =>
        new(true, message, data, null);

    public static ApiResponse<T> Ok(string message) =>
        new(true, message, default, null);

    public static ApiResponse<T> Fail(ApiError error, string message = "Request failed") =>
        new(false, message, default, error);
}
