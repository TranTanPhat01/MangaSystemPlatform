namespace Manga.BuildingBlocks.Exceptions;

public sealed record ValidationError(string Field, string Message);
