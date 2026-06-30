using System.Diagnostics;
using Grpc.Core;
using Grpc.Core.Interceptors;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Manga.BuildingBlocks.Middleware;

namespace Manga.BuildingBlocks.Grpc;

public sealed class InternalGrpcClientInterceptor : Interceptor
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<InternalGrpcClientInterceptor> _logger;

    public InternalGrpcClientInterceptor(
        IConfiguration configuration,
        ILogger<InternalGrpcClientInterceptor> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
        TRequest request,
        ClientInterceptorContext<TRequest, TResponse> context,
        AsyncUnaryCallContinuation<TRequest, TResponse> continuation)
    {
        var headers = context.Options.Headers ?? new Metadata();
        var apiKey = _configuration[$"{InternalGrpcOptions.SectionName}:ApiKey"];
        if (!string.IsNullOrWhiteSpace(apiKey) &&
            !headers.Any(header => string.Equals(header.Key, InternalGrpcOptions.ApiKeyHeaderName, StringComparison.OrdinalIgnoreCase)))
        {
            headers.Add(InternalGrpcOptions.ApiKeyHeaderName, apiKey);
        }

        var correlationId = CorrelationIdContext.Current;
        if (string.IsNullOrWhiteSpace(correlationId))
        {
            correlationId = Guid.NewGuid().ToString();
            CorrelationIdContext.Current = correlationId;
        }

        if (!headers.Any(header => string.Equals(header.Key, "x-correlation-id", StringComparison.OrdinalIgnoreCase)))
        {
            headers.Add("x-correlation-id", correlationId);
        }

        var options = context.Options.WithHeaders(headers);
        var nextContext = new ClientInterceptorContext<TRequest, TResponse>(
            context.Method,
            context.Host,
            options);

        _logger.LogInformation(
            "gRPC client call started Method={Method} CorrelationId={CorrelationId}",
            context.Method.FullName,
            correlationId);

        var stopwatch = Stopwatch.StartNew();
        var call = continuation(request, nextContext);

        return new AsyncUnaryCall<TResponse>(
            LogResponseAsync(call.ResponseAsync, context.Method.FullName, stopwatch, correlationId),
            call.ResponseHeadersAsync,
            call.GetStatus,
            call.GetTrailers,
            call.Dispose);
    }

    private async Task<TResponse> LogResponseAsync<TResponse>(
        Task<TResponse> responseTask,
        string method,
        Stopwatch stopwatch,
        string correlationId)
    {
        try
        {
            var response = await responseTask;
            stopwatch.Stop();
            _logger.LogInformation(
                "gRPC call completed Method={Method} Status={Status} ElapsedMs={ElapsedMs} CorrelationId={CorrelationId}",
                method,
                StatusCode.OK,
                stopwatch.ElapsedMilliseconds,
                correlationId);
            return response;
        }
        catch (RpcException exception)
        {
            stopwatch.Stop();
            _logger.LogWarning(
                exception,
                "gRPC call completed Method={Method} Status={Status} ElapsedMs={ElapsedMs} CorrelationId={CorrelationId}",
                method,
                exception.StatusCode,
                stopwatch.ElapsedMilliseconds,
                correlationId);
            throw;
        }
    }
}
