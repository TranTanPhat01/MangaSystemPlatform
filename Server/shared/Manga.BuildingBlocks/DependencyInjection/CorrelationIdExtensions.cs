using Manga.BuildingBlocks.Middleware;

namespace Manga.BuildingBlocks.DependencyInjection;

public static class CorrelationIdExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app) =>
        app.UseMiddleware<CorrelationIdMiddleware>();
}
