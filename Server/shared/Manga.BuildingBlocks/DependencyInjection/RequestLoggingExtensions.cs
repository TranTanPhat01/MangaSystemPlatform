using Manga.BuildingBlocks.Middleware;
using Serilog;

namespace Manga.BuildingBlocks.DependencyInjection;

public static class RequestLoggingExtensions
{
    public static IApplicationBuilder UseMangaRequestLogging(this IApplicationBuilder app) =>
        app.UseSerilogRequestLogging(options =>
        {
            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("CorrelationId", ReadCorrelationId(httpContext));
                diagnosticContext.Set("UserId", ReadUserId(httpContext));
            };
        });

    private static string ReadCorrelationId(HttpContext context)
    {
        if (context.Items.TryGetValue(CorrelationIdMiddleware.ItemName, out var value) &&
            value is not null)
        {
            return value.ToString() ?? context.TraceIdentifier;
        }

        return context.TraceIdentifier;
    }

    private static string? ReadUserId(HttpContext context)
    {
        return context.User.FindFirst("sub")?.Value
            ?? context.User.FindFirst("userId")?.Value
            ?? context.User.FindFirst("nameid")?.Value;
    }
}
