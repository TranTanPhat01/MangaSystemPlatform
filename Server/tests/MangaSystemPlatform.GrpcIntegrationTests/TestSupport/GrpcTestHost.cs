using System.Net;
using Grpc.Core;
using Grpc.Net.Client;
using Manga.BuildingBlocks.Grpc;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MangaSystemPlatform.GrpcIntegrationTests.TestSupport;

internal sealed class GrpcTestHost : IDisposable
{
    public const string ApiKey = "test-internal-grpc-key";

    private readonly TestServer _server;

    public GrpcTestHost(Action<IServiceCollection> configureServices, Action<IEndpointRouteBuilder> mapGrpcService)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["InternalGrpc:ApiKey"] = ApiKey
            })
            .Build();

        var builder = new WebHostBuilder()
            .ConfigureServices(services =>
            {
                services.AddSingleton<IConfiguration>(configuration);
                services.AddLogging();
                services.AddSingleton<InternalGrpcServerInterceptor>();
                services.AddGrpc(options =>
                {
                    options.Interceptors.Add<InternalGrpcServerInterceptor>();
                });

                configureServices(services);
            })
            .Configure(app =>
            {
                app.UseRouting();
                app.UseEndpoints(mapGrpcService);
            });

        _server = new TestServer(builder);
    }

    public TClient CreateClient<TClient>(Func<GrpcChannel, TClient> factory)
    {
        var httpClient = _server.CreateClient();
        httpClient.BaseAddress = new Uri("http://localhost");
        httpClient.DefaultRequestVersion = HttpVersion.Version20;
        httpClient.DefaultVersionPolicy = HttpVersionPolicy.RequestVersionExact;

        var channel = GrpcChannel.ForAddress(httpClient.BaseAddress, new GrpcChannelOptions
        {
            HttpClient = httpClient
        });

        return factory(channel);
    }

    public static Metadata ValidMetadata() => new()
    {
        { InternalGrpcOptions.ApiKeyHeaderName, ApiKey }
    };

    public static Metadata WrongMetadata() => new()
    {
        { InternalGrpcOptions.ApiKeyHeaderName, "wrong-key" }
    };

    public void Dispose()
    {
        _server.Dispose();
    }
}
