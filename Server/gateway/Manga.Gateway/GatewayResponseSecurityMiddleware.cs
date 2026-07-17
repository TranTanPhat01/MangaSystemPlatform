namespace Manga.Gateway;

public sealed class GatewayResponseSecurityMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;

    public GatewayResponseSecurityMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            if (_configuration.GetValue("Gateway:SecurityHeaders:Enabled", true))
            {
                context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
                context.Response.Headers.TryAdd("Referrer-Policy", _configuration["Gateway:SecurityHeaders:ReferrerPolicy"] ?? "no-referrer");
                context.Response.Headers.TryAdd("X-Frame-Options", "DENY");
            }

            if (_configuration.GetValue("Gateway:SecurityHeaders:RemoveServerHeader", true))
            {
                context.Response.Headers.Remove("Server");
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
