using Serilog.Context;

namespace Manga.BuildingBlocks.Middleware;

public sealed class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-Id";
    public const string ItemName = "CorrelationId";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = ReadCorrelationId(context);
        context.Items[ItemName] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        var previousCorrelationId = CorrelationIdContext.Current;
        CorrelationIdContext.Current = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            try
            {
                await _next(context);
            }
            finally
            {
                CorrelationIdContext.Current = previousCorrelationId;
            }
        }
    }

    private static string ReadCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(HeaderName, out var values))
        {
            var headerValue = values.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(headerValue))
            {
                return headerValue;
            }
        }

        return Guid.NewGuid().ToString();
    }
}
