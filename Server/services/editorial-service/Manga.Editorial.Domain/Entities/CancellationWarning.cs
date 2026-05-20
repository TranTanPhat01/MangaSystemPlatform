using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Domain.Entities;

public sealed class CancellationWarning
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SeriesId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public CancellationRiskLevel RiskLevel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
