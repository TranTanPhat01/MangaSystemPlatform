using System.Threading;

namespace Manga.BuildingBlocks.Middleware;

public static class CorrelationIdContext
{
    private static readonly AsyncLocal<string?> CurrentValue = new();

    public static string? Current
    {
        get => CurrentValue.Value;
        set => CurrentValue.Value = value;
    }

    public static void Clear()
    {
        CurrentValue.Value = null;
    }
}
