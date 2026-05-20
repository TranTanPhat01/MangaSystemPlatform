using System.Text.Json;
using Manga.BuildingBlocks.Exceptions;
using Manga.BuildingBlocks.Responses;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace Manga.BuildingBlocks.Middleware;

public sealed class GlobalExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var error = CreateError(exception, context.TraceIdentifier);

        _logger.LogError(
            exception,
            "API error {ErrorCode} on {Method} {Path}. StatusCode={StatusCode}, TraceId={TraceId}, Message={Message}",
            error.Error.Code,
            context.Request.Method,
            context.Request.Path,
            error.StatusCode,
            context.TraceIdentifier,
            exception.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = error.StatusCode;

        var response = ApiResponse<object>.Fail(error.Error);
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }

    private ErrorResult CreateError(Exception exception, string traceId)
    {
        if (exception is AppException appException)
        {
            return new ErrorResult(
                appException.StatusCode,
                new ApiError(
                    appException.ErrorCode,
                    appException.Message,
                    AddDevelopmentDetails(appException.Details, exception, traceId)));
        }

        if (IsFluentValidationException(exception))
        {
            return new ErrorResult(
                StatusCodes.Status422UnprocessableEntity,
                new ApiError(
                    "VALIDATION_ERROR",
                    "Validation failed.",
                    AddDevelopmentDetails(ReadFluentValidationErrors(exception), exception, traceId)));
        }

        if (exception is DbUpdateException)
        {
            return new ErrorResult(
                StatusCodes.Status500InternalServerError,
                new ApiError(
                    "DATABASE_UPDATE_ERROR",
                    "A database error occurred.",
                    AddDevelopmentDetails(null, exception, traceId)));
        }

        if (exception is UnauthorizedAccessException)
        {
            return new ErrorResult(
                StatusCodes.Status401Unauthorized,
                new ApiError(
                    "UNAUTHORIZED",
                    "Unauthorized access.",
                    AddDevelopmentDetails(null, exception, traceId)));
        }

        return new ErrorResult(
            StatusCodes.Status500InternalServerError,
            new ApiError(
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred.",
                AddDevelopmentDetails(null, exception, traceId)));
    }

    private object? AddDevelopmentDetails(object? details, Exception exception, string traceId)
    {
        if (!_environment.IsDevelopment())
        {
            return details;
        }

        return new
        {
            details,
            traceId,
            exceptionType = exception.GetType().Name
        };
    }

    private static bool IsFluentValidationException(Exception exception) =>
        exception.GetType().FullName == "FluentValidation.ValidationException";

    private static object? ReadFluentValidationErrors(Exception exception)
    {
        var errorsProperty = exception.GetType().GetProperty("Errors");
        return errorsProperty?.GetValue(exception);
    }

    private sealed record ErrorResult(int StatusCode, ApiError Error);
}
