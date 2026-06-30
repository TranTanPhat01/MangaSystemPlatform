using System.Diagnostics;
using Grpc.Core;
using Grpc.Core.Interceptors;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Manga.BuildingBlocks.Middleware;
using Serilog.Context;

namespace Manga.BuildingBlocks.Grpc;

public sealed class InternalGrpcServerInterceptor : Interceptor
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<InternalGrpcServerInterceptor> _logger;

    public InternalGrpcServerInterceptor(
        IConfiguration configuration,
        ILogger<InternalGrpcServerInterceptor> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public override async Task<TResponse> UnaryServerHandler<TRequest, TResponse>(
        TRequest request,
        ServerCallContext context,
        UnaryServerMethod<TRequest, TResponse> continuation)
    {
        var correlationId = GetHeaderValue(context.RequestHeaders, "x-correlation-id");
        if (string.IsNullOrWhiteSpace(correlationId))
        {
            correlationId = Guid.NewGuid().ToString();
        }

        var previousCorrelationId = CorrelationIdContext.Current;
        CorrelationIdContext.Current = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            _logger.LogInformation(
                "gRPC server call received Method={Method} CorrelationId={CorrelationId}",
                context.Method,
                correlationId);

            var stopwatch = Stopwatch.StartNew();
            var status = StatusCode.OK;

            try
            {
                EnsureAuthorized(context);
                var response = await continuation(request, context);
                return response;
            }
            catch (RpcException exception)
            {
                status = exception.StatusCode;
                throw;
            }
            catch
            {
                status = StatusCode.Internal;
                throw;
            }
            finally
            {
                stopwatch.Stop();
                _logger.LogInformation(
                    "gRPC call completed Method={Method} Status={Status} ElapsedMs={ElapsedMs} CorrelationId={CorrelationId}",
                    context.Method,
                    status,
                    stopwatch.ElapsedMilliseconds,
                    correlationId);

                CorrelationIdContext.Current = previousCorrelationId;
            }
        }
    }

    private void EnsureAuthorized(ServerCallContext context)
    {
        var expectedApiKey = _configuration[$"{InternalGrpcOptions.SectionName}:ApiKey"];
        if (string.IsNullOrWhiteSpace(expectedApiKey))
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Internal gRPC API key is not configured."));
        }

        var actualApiKey = GetHeaderValue(context.RequestHeaders, InternalGrpcOptions.ApiKeyHeaderName);
        if (!string.Equals(expectedApiKey, actualApiKey, StringComparison.Ordinal))
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid internal gRPC API key."));
        }
    }

    private static string? GetHeaderValue(Metadata headers, string name) =>
        headers.FirstOrDefault(header => string.Equals(header.Key, name, StringComparison.OrdinalIgnoreCase))?.Value;
}
