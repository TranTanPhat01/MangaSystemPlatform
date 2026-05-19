using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Services;

public interface ISeriesService
{
    Task<Result<SeriesResponse>> CreateAsync(CreateSeriesRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<SeriesResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<SeriesResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<SeriesResponse>> UpdateAsync(Guid id, UpdateSeriesRequest request, CancellationToken cancellationToken = default);
}
