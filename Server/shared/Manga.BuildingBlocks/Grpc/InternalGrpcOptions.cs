namespace Manga.BuildingBlocks.Grpc;

public sealed class InternalGrpcOptions
{
    public const string SectionName = "InternalGrpc";
    public const string ApiKeyHeaderName = "x-internal-api-key";

    public string ApiKey { get; set; } = string.Empty;
}
