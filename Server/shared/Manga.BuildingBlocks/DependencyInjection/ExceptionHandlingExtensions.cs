using Manga.BuildingBlocks.Middleware;

namespace Manga.BuildingBlocks.DependencyInjection;

public static class ExceptionHandlingExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandling(this IApplicationBuilder app) =>
        app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
}
