namespace Manga.BuildingBlocks.Responses;

public sealed record ApiError(string Code, string Message, object? Details = null);
