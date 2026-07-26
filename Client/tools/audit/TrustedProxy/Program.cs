using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

var targetBase = builder.Configuration["TRUSTED_PROXY_TARGET"] ?? "http://manga-prodlike-gateway-1:8080";
var certificatePath = builder.Configuration["TLS_CERTIFICATE_PATH"] ?? "/https/api.manga.local.pfx";
var certificatePassword = builder.Configuration["TLS_CERTIFICATE_PASSWORD"] ?? string.Empty;

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.ListenAnyIP(8080);
    options.ListenAnyIP(8443, listen => listen.UseHttps(certificatePath, certificatePassword));
});

builder.Services.AddHttpClient("proxy", client =>
{
    client.BaseAddress = new Uri(targetBase);
    client.Timeout = TimeSpan.FromSeconds(30);
}).ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
{
    AllowAutoRedirect = false
});

var app = builder.Build();

app.Run(async context =>
{
    var factory = context.RequestServices.GetRequiredService<IHttpClientFactory>();
    var client = factory.CreateClient("proxy");
    var target = new Uri(client.BaseAddress!, context.Request.PathBase + context.Request.Path + context.Request.QueryString);

    using var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), target);
    foreach (var header in context.Request.Headers)
    {
        if (header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) ||
            header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase) ||
            header.Key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        if (!request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
        {
            request.Content ??= new StreamContent(context.Request.Body);
            request.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }
    }

    request.Headers.Host = context.Request.Host.Value;
    request.Headers.Remove("X-Forwarded-Proto");
    request.Headers.Remove("X-Forwarded-Host");
    request.Headers.Remove("X-Forwarded-For");
    request.Headers.TryAddWithoutValidation("X-Forwarded-Proto", context.Request.Scheme);
    request.Headers.TryAddWithoutValidation("X-Forwarded-Host", context.Request.Host.Host);
    request.Headers.TryAddWithoutValidation("X-Forwarded-For", context.Connection.RemoteIpAddress?.ToString() ?? "unknown");

    if (context.Request.ContentLength is > 0 && request.Content is null)
    {
        request.Content = new StreamContent(context.Request.Body);
        if (!string.IsNullOrWhiteSpace(context.Request.ContentType))
        {
            request.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
        }
    }

    using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);
    context.Response.StatusCode = (int)response.StatusCode;
    foreach (var header in response.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }
    foreach (var header in response.Content.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }
    context.Response.Headers.Remove("transfer-encoding");
    await response.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
});

app.Run();
