using System.Diagnostics;
using Grpc.Core;
using Grpc.Core.Interceptors;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

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

        var correlationId = _configuration["CorrelationId"];
        if (!string.IsNullOrWhiteSpace(correlationId) &&
            !headers.Any(header => string.Equals(header.Key, "x-correlation-id", StringComparison.OrdinalIgnoreCase)))
        {
            headers.Add("x-correlation-id", correlationId);
        }

        var options = context.Options.WithHeaders(headers);
        var nextContext = new ClientInterceptorContext<TRequest, TResponse>(
            context.Method,
            context.Host,
            options);

        var stopwatch = Stopwatch.StartNew();
        var call = continuation(request, nextContext);

        return new AsyncUnaryCall<TResponse>(
            LogResponseAsync(call.ResponseAsync, context.Method.FullName, stopwatch),
            call.ResponseHeadersAsync,
            call.GetStatus,
            call.GetTrailers,
            call.Dispose);
    }

    private async Task<TResponse> LogResponseAsync<TResponse>(
        Task<TResponse> responseTask,
        string method,
        Stopwatch stopwatch)
    {
        try
        {
            var response = await responseTask;
            stopwatch.Stop();
            _logger.LogInformation(
                "gRPC client call {Method} completed with {Status} in {ElapsedMilliseconds}ms.",
                method,
                StatusCode.OK,
                stopwatch.ElapsedMilliseconds);
            return response;
        }
        catch (RpcException exception)
        {
            stopwatch.Stop();
            _logger.LogWarning(
                exception,
                "gRPC client call {Method} completed with {Status} in {ElapsedMilliseconds}ms.",
                method,
                exception.StatusCode,
                stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}
