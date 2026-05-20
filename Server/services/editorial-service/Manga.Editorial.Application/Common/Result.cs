namespace Manga.Editorial.Application.Common;

public sealed class Result<T>
{
    private Result(bool ok, T? value, string? error) { IsSuccess = ok; Value = value; Error = error; }
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}
